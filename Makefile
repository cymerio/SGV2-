#
# Makefile for compiling the project in Unix/Linux systems
#

INPUT=SGPP/app.ts
OUTPUT=Steamgifts++.js

all:
	tsc --target ES5 --removeComments --out temp.js $(INPUT)
	java -jar yuicompressor-2.4.8.jar --type js -o temp2.js temp.js
	rm -f temp.js
	rm -f $(OUTPUT)
	cat Monkeyheader.js >> $(OUTPUT)
	cat temp2.js >> $(OUTPUT)
	rm -f temp2.js
debug:
	tsc --target ES5 --noImplicitAny --out temp.js $(INPUT)
	rm -f $(OUTPUT)
	cat Monkeyheader.js >> $(OUTPUT)
	cat temp.js >> $(OUTPUT)
	rm -f temp.js
clean:
	rm -f $(OUTPUT) temp.js temp2.js
