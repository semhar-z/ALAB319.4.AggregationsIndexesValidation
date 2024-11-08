import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

/**
 * It is not best practice to seperate these routes
 * like we have done here. This file was created
 * specifically for educational purposes, to contain
 * all aggregation routes in one place.
 */

/**
 * Grading Weights by Score Type:
 * - Exams: 50%
 * - Quizes: 30%
 * - Homework: 20%
 */

// Get the weighted average of a specified learner's grades, per class
router.get("/learner/:id/avg-class", async (req, res) => {
  let collection = await db.collection("grades");

  let result = await collection
    .aggregate([
      {
        $match: { learners_id: Number(req.params.id) },
      },
      {
        $unwind: { path: "$scores" },
      },
      {
        $group: {
          _id: "$class_id",
          quiz: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "quiz"] },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
          exam: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "exam"] },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
          homework: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "homework"] },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          class_id: "$_id",
          avg: {
            $sum: [
              { $multiply: [{ $avg: "$exam" }, 0.5] },
              { $multiply: [{ $avg: "$quiz" }, 0.3] },
              { $multiply: [{ $avg: "$homework" }, 0.2] },
            ],
          },
        },
      },
    ])
    .toArray();

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

router.get("/learner/:id/avg", async (req, res) => {
  try {
    const collection = await db.collection("grades");
    const result = await collection
      .aggregate([
        {
          $match: { learners_id: Number(req.params.id) },
          $unwind: "$scores",
        },
        {
          $group: {
            _id: "$class_id",
            quizAvg: {
              $avg: {
                $cond: {
                  if: { $eq: ["$scores.type", "quiz"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
            examAvg: {
              $avg: {
                $cond: {
                  if: { $eq: ["$scores.type", "exam"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
            homeworkAvg: {
              $avg: {
                $cond: {
                  if: { $eq: ["$scores.type", "homework"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            class_id: "$_id",
            avg: {
              $sum: [
                { $multiply: [{ $ifNull: ["$examAvg", 0] }, 0.5] }, 
                { $multiply: [{ $ifNull: ["$quizAvg", 0] }, 0.3] }, 
                { $multiply: [{ $ifNull: ["$homeworkAvg", 0] }, 0.2] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAvg: { $avg: "$avg" },
          },
        },
        {
          $project: {
            _id: 0,
            overallAverage: "$totalAvg",
          },
        },
      ])
      .toArray();
    if (result.length === 0) {
      return res.status(404).send("Learner's average not found.");
    }
    console.log("Result:", result);
    res.status(200).send(result[0]);
  } catch (error) {
    console.error("Error in /learner/:id/avg route:", error);
    res.status(500).send("Internal Server Error.");
  }
});

// Create a GET route at /grades/stats
router.get("/grades/stats", async (req, res) => {
  try {
    const collection = await db.collection("grades");

    const result = await collection
      .aggregate([
        { $unwind: "$scores" },
            {
          $group: {
            _id: "$learners_id",
            quizAvg: {
              $avg: {
                $cond: {
                  if: { $eq: ["$scores.type", "quiz"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
            examAvg: {
              $avg: {
                $cond: {
                  if: { $eq: ["$scores.type", "exam"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
            homeworkAvg: {
              $avg: {
                $cond: {
                  if: { $eq: ["$scores.type", "homework"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
          },
        },

        // Calculate the weighted average for each learner
        {
          $project: {
            _id: 0,
            learners_id: "$_id",
            weightedAvg: {
              $sum: [
                { $multiply: [{ $ifNull: ["$examAvg", 0] }, 0.5] }, 
                { $multiply: [{ $ifNull: ["$quizAvg", 0] }, 0.3] }, 
                { $multiply: [{ $ifNull: ["$homeworkAvg", 0] }, 0.2] },
              ],
            },
          },
        },

        // Classify learners based on their weighted average and count totals
        {
          $facet: {
            above70: [
              { $match: { weightedAvg: { $gt: 70 } } },
              { $count: "count" },
            ],
            totalLearners: [
              { $count: "count" },
            ],
          },
        },

        // Calculate the percentage of learners with an average above 70%
        {
          $project: {
            numAbove70: { $arrayElemAt: ["$above70.count", 0] },
            totalLearners: { $arrayElemAt: ["$totalLearners.count", 0] },
          },
        },
        {
          $addFields: {
            percentageAbove70: {
              $multiply: [
                { $divide: ["$numAbove70", "$totalLearners"] },
                100,
              ],
            },
          },
        },
      ])
      .toArray();

     // response data
    const stats = result[0] || {
      numAbove70: 0,
      totalLearners: 0,
      percentageAbove70: 0,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in /grades/stats route:", error);
    res.status(500).send("Internal Server Error.");
  }
});

// Create a single-field index on class_id.
// Create a single-field index on learner_id.

async function createIndexes() {
  let collection = await db.collection("grades");

  // a single-field index on class_id
  await collection.createIndex({ class_id: 1 });

  // a single-field index on learner_id
  await collection.createIndex({ learners_id: 1 });

  console.log("Indexes created on class_id and learner_id");
}

createIndexes().catch(console.error);


// Create a compound index on learner_id and class_id in ascending order
async function createCompoundIndex() {
  let collection = await db.collection("grades");

  await collection.createIndex({ learners_id: 1, class_id: 1 });

  console.log("Compound index created on learner_id and class_id");
}

createCompoundIndex().catch(console.error);


// Create the following validation rules on the grades collection:
// Each document must have a class_id field, which must be an integer between 0 and 300, inclusive.
// Each document must have a learner_id field, which must be an integer greater than or equal to 0.

async function setValidationRules() {
  try {
    await db.command({
      collMod: "grades",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["class_id", "learner_id"],
          properties: {
            class_id: {
              bsonType: "int",
              minimum: 0,
              maximum: 300,
              description: "must be an integer between 0 and 300 and is required"
            },
            learners_id: {
              bsonType: "int",
              minimum: 0,
              description: "must be an integer greater than or equal to 0 and is required"
            }
          }
        }
      },
      validationLevel: "strict",
      validationAction: "warn"
    });

    console.log("Validation rules applied to 'grades' collection");
  } catch (error) {
    console.error("Error applying validation rules:", error);
  }
}

setValidationRules();


export default router;
