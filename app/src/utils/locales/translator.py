from google.cloud import translate
import json, sys

def translateToLang(target):
	client = translate.Client()
	x = ""

	with open('en.json', 'r') as f:
		x = ''.join(f.readlines())

	codes = json.loads(x)

	translated_codes = {}

	for code in codes.keys():
		translated_codes[code] = client.translate(codes[code], target_language=target)["translatedText"]

	result = json.dumps(translated_codes)

	with open('{}.json'.format(target), 'w') as f:
		f.write(result)

if __name__ == '__main__':
	translateToLang(sys.argv[1])