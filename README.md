# project name

## Usage

### Run

`./run`

### Manually Building

Do this if you are getting server errors after pulling

`./run build`

### Manually Restarting Server

`touch conf/default.yaml`

### Adding a depdendency (without rebuilding)

```
npm info [package] version
[add depedency:version to pacakge.json]
./run npmi
```

### Entering Container

`./run enter`

### Linting

`./run lint`

### Shell

`./run shell`
