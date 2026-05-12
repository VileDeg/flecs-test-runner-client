# Flecs Test Runner Client

Web client for the **Flecs Test Runner (FTR)**.

Will connect to a locally running Flecs application on default Flecs Rest API port (see the Flecs [docs](https://www.flecs.dev/flecs/md_docs_2FlecsRemoteApi.html)).

Allows the user to import/export tests in JSON format and modify them or define them via GUI from scratch.

Allows to run the tests remotely on the application that uses [**FTR Core**](https://github.com/VileDeg/flecs-test-runner) and correctly intializes Flecs REST API.

## Run

The project is publicly accessible at [GitHub Pages](https://viledeg.github.io/flecs-test-runner-client/).

## Build And Run locally

To build the project `npm` has to be installed on the system.
Install dependencies:

```powershell
npm install
```

Run:

```powershell
npm run dev
```

## Testing

Folder `sample_tests` contains tests that can be imported and executed when connected to the running [FTR Sample Project](https://github.com/VileDeg/flecs-test-runner-sample-project) application to validate the **FTR Client** behavior or simply to demonstrate it.

## Notes

The project is still in development state, so it may contain bugs, TODO comments, commented code, debug logs etc.

## Potential Improvements

- Add a visual indicator in Expected when entity/component/property is the same as intial. (maybe just toned down colors?)
- Make initial and expected maintain same order of components and entities (better UX).
- Add ability to drag components (swap places)? 
- Check if system has affected any entities. If not, produce warning.
- Fill Expected: Return only the serialized entities that have changed to save bandwidth.
  - But how to tell when the entity got deleted?
- Add option to specify delta time in system?
  - Would this be useful?
- Support import/export in YAML format.
  - Would improve readability.
