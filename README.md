# ready-memory-disk

A synchronous, in-memory block device for [READY](https://fantasyarca.de/ready/).

Disks are self-describing; block zero stores the "physical" characteristics (block size, count), as well as a user-assignable label.