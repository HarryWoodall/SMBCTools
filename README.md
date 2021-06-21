# SMBCTools



## Description

Comming soon...

## Installation

Inside `.bash_profile` create a variable called `SMBC_TOOLS` and assign it the absolute path of this repo. Also needed is a variable called `WORK_DIR` which is a reference to your code directory. Below this, add the `SMBCScripts.sh` file as a source.

```bash
SMBC_TOOLS=<Path to repo>;
WORK_DIR=<Path to code directory>;
source "$SMBC_TOOLS/SMBCScripts.sh";
```

Restart the terminal

As this repo contains JS files, you will have to install the node dependencies. To do this, run this command.

```
smbcinit
```

> Note: The 'flow' command was written to use [Typora](https://typora.io/) as a mark down viewer. If you wish to use that command, please download it and set it as your default markdown viewer

## Usage
List of commands

- addjson
- model
- slugs
- validate
- flow
- jira
