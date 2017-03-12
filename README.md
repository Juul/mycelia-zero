
THIS PROJECT IS DEFUNCT.

It never got to a useful state, however, I am currently developing a very similar project at called the bionet which will publicly launch in mid-June 2017. The modules that make up the project have already started appearing on the [biobricks](https://github.com/biobricks/) github page. The bionet is basically decentralized github for biology but with inventory tracking and sharing of physical materials (via sneakernet) as a core feature. It uses versioning inspired by git but operates on both key-value and tree structures (file systems) equally well and never forces you to merge.

------------

This is a work in progress. Not yet ready for developer release.

No automatic installation of dependencies yet.

Hook up a Brother QL-570 thermal label printer.

Edit config file: config.js

Start webserver: ./server.js

Start print service: ./printservice.js

Browse to http://localhost:3000/

If you don't want to use the print service (e.g. during development), you can bypass it by setting config.printer.direct = true, in config.js.
