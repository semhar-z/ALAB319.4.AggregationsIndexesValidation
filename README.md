# Node.js template

This is a Node.js project.

Add your [configuration](https://codesandbox.io/docs/projects/learn/setting-up/tasks) to optimize it for [CodeSandbox](https://codesandbox.io/p/dashboard).

## Resources

- [CodeSandbox — Docs](https://codesandbox.io/docs/projects)
- [CodeSandbox — Discord](https://discord.gg/Ggarp3pX5H)
# ALAB319.4.AggregationsIndexesValidation

// Create the following features, using good organizational and coding practices:

- Create a GET route at /grades/stats
- Within this route, create an aggregation pipeline that returns the following information:
- The number of learners with a weighted average (as calculated by the existing routes) higher than 70%.
- The total number of learners.
- The percentage of learners with an average above 70% (a ratio of the above two outputs).
- Create a GET route at /grades/stats/:id
- Within this route, mimic the above aggregation pipeline, but only for learners within a class that has a class_id equal to the specified :id.
- Create a single-field index on class_id.
- Create a single-field index on learner_id.
- Create a compound index on learner_id and class_id, in that order, both ascending.
- Create the following validation rules on the grades collection:
- Each document must have a class_id field, which must be an integer between 0 and 300, inclusive.
- Each document must have a learner_id field, which must be an integer greater than or equal to 0.
- Change the validation action to "warn."
