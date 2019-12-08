# Time-Travel-\(Contract-Testing\)

## Summary

* This CLI feature is for testing purposes only \(using ganache\)and works by allowing the tester to travel to the future and test out the Polymath contracts.

## How it works

Options Command `$ node CLI/polymath-cli time_travel -h`

```text
Usage: time_travel|tt [options]

Increases time on EVM according to given value.

Options:
  -p, --period <seconds>         Period of time in seconds to increase
  -d, --toDate <date>            Human readable date ("MM/DD/YY [HH:mm:ss]") to travel to
  -e, --toEpochTime <epochTime>  Unix Epoch time to travel to
  -h, --help                     output usage information
```

## How to Use this CLI Feature \(Instructions\):

**Period of time in seconds to increase**

```text
$ node CLI/polymath-cli time_travel -p 100

Current datetime is 1547057116 or 01/09/2019 13:05:16
```

**Human readable date \("MM/DD/YY \[HH:mm:ss\]"\) to travel to**

```text
$ node CLI/polymath-cli time_travel -d 03/01/23
Current datetime is 1677646800 or 03/01/2023 00:00:00
```

**Unix Epoch time to travel to**

```text
$ node CLI/polymath-cli time_travel -e 1551476197

Current datetime is 1551476197 or 03/01/2019 16:36:37
```

## Troubleshooting / FAQs

n/a

