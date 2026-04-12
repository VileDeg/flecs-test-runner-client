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

```ps
npm install
```

Run:

```ps
npm run dev
```

## Testing

Folder `test_json` contains tests that can be imported and executed when connected to the running [FTR Sample Project](https://github.com/VileDeg/flecs-test-runner-sample-project) application to validate the **FTR Client** behavior or simply to demonstrate it.
