
![on-push](../../actions/workflows/on-push.yaml/badge.svg)
![on-pull-request](../../actions/workflows/on-pull-request.yaml/badge.svg)
![on-schedule](../../actions/workflows/on-schedule.yaml/badge.svg)

# WCU-AIR's Website

Visit **[wcu-air.github.io/airlab](https://wcu-air.github.io/airlab)** 🚀


## Test locally with Conda

From the repository root, create the environment and install the gems:

```bash
./scripts/setup-conda.sh
```

Then launch the production-mode Jekyll server:

```bash
./scripts/serve-local.sh
```

Open [http://localhost:4004/airlab/](http://localhost:4004/airlab/). The
environment uses Ruby 3.1 and the Bundler version from `Gemfile.lock`, matching
the GitHub build workflow.

_Built with [Lab Website Template](https://greene-lab.gitbook.io/lab-website-template-docs)_
