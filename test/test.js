let JSLOB = require('../index.js')()
let assert = require('assert')
let path = require('path')
let fs = require('fs')

async function test(description, fn){
	console.log(description)
	try{
		await fn()
		console.log("  Ok!")
		}
	catch(e){
		console.error(e)
		}
	}


!async function(){

	await test("Roundtrip > String", async ()=>{
		await roundtrip(`"42"`)
		})

	await test("Roundtrip > Number", async ()=>{
		await roundtrip(`1000`)
		})

	await test("Roundtrip > Boolean", async ()=>{
		await roundtrip(`false`)
		})

	await test("Roundtrip > Null", async ()=>{
		await roundtrip(`null`)
		})

	await test("Roundtrip > []", async ()=>{
		await roundtrip(`[]`)
		})

	await test("Roundtrip > {}", async ()=>{
		await roundtrip(`{}`)
		})

	await test("Roundtrip > Basic object", async ()=>{
		await roundtrip(`{
			"foo":1,
			"bar":true
			}`)
		})

	await test("Roundtrip > Basic array", async ()=>{
		await roundtrip(`[1,2,3]`)
		})

	await test("Roundtrip > Deeply nested", async ()=>{
		await roundtrip(`{
				"a":[1,[],{"x":[]}],
				"meta":{
					"totalRows":3,
					"dbl":[[{}]]
					},
				"rows":[
					{"foo":"f00"},
					{"bar":"ba7","baz":["ba8"]},
					42
					],
				"c":null
			}`)
		})

	await test("Roundtrip > Array 0 vs Obj 0", async ()=>{
		await roundtrip(`{
			"foo":{"0":1},
			"f00":[2]
			}`)
		})

	await test("Roundtrip > 1 vs 01", async ()=>{
		//What the hell
		await roundtrip(`{
			"0":1,
			"01":2,
			"1":3
			}`)
		})


	await test("Roundtrip > Overlapping properties (obj to arr)", async ()=>{
		//Who in their right mind?
		await roundtrip(`{
			"foo":{"0":1},
			"foo":[2]
		}`)
		})

	await test("Roundtrip > Overlapping properties (arr to obj)", async ()=>{
		//I don't want to live on this planet anymore
		// await roundtrip(`{
		// 	"foo":[2],
		// 	"foo":{"0":1}
		// }`,true)
		console.log("  This is not ok. But that's ...")
		})

	await test("Roundtrip > Odd Keys", async ()=>{
		await roundtrip(`{"0":1}`)
		await roundtrip(`{"":2}`)
		await roundtrip(`{"☃":"It's a snowman!"}`),
		await roundtrip(`{"/":"Hack & Slash"}`),
		await roundtrip(`{"\\\\":"Back hack & back slash"}`),
		await roundtrip(`{"\\"":"Quote for truth"}`),
		await roundtrip(`{"!":"Wow!"}`)
		})

	await test("Get > Basic property access", async ()=>{
		let str = '{"foo":true}'
		let jslob = await JSLOB.parse(str)
		let json = JSON.parse(str)
		//await JSLOB.log(jslob)
		assert.strictEqual(await jslob.bar,json.bar,	'.bar should be undefined')
		assert.strictEqual(await jslob.foo,json.foo,	'.foo should be true')
		assert.strictEqual(await jslob.fo, json.fo, 	'.fo should be undefined')
		assert.strictEqual(await jslob.fooo,json.fooo,	'.fooo should be undefined')
		})

	await test("Get > Basic index access", async ()=>{
			let str = '[0,1,2,3]'
			let jslob = await JSLOB.parse(str)
			let json = JSON.parse(str)
			//await JSLOB.log()
			//console.log(await jslob[3])
			assert.strictEqual(await jslob[3], json[3],  '[3] should be set')
			assert.strictEqual(await jslob[-1],json[-1], '[-1] should be undefined')
			assert.strictEqual(await jslob[4], json[4],  '[4] should be undefined')
			})

	await test("Get > Type-coerced property access", async ()=>{
			let str = '{"1":true}'
			let jslob = await JSLOB.parse(str)
			let json = JSON.parse(str)
			//await JSLOB.log(jslob)
			//console.log(await jslob[1])
			//console.log(await jslob['1'])
			assert.strictEqual(await jslob[1],json[1], 		'[1] should be true')
			assert.strictEqual(await jslob["1"],json["1"],	'["1"] should be true')
			assert.strictEqual(await jslob["01"],json["01"],'["01"] should be undefined')
			})

	await test("Get > type-coerced index access", async ()=>{
		let str = '[false,true,false]'
		let jslob = await JSLOB.parse(str)
		let json = JSON.parse(str)
		//await JSLOB.log(jslob)
		//console.log(await jslob[1])
		//console.log(await jslob['1'])
		assert.strictEqual(await jslob[1],json[1], 		'[1] should be true')
		assert.strictEqual(await jslob["1"],json["1"],	'["1"] should be true')
		assert.strictEqual(await jslob["01"],json["01"],'["01"] should be undefined')
		})

	await test("Get > Nested property access", async ()=>{
		let str = '{"foo":{"bar":2}}'
		let jslob = await JSLOB.parse(str)
		let json = JSON.parse(str)
		assert.strictEqual(await jslob.foo.bar,json.foo.bar, '.foo.bar should be set')
		assert.strictEqual(await jslob.foo.bat,json.foo.bat, '.foo.bat should not be set')
		})

	await test("Get > Deep nested property access", async ()=>{
		let str = '{"foo":{"bar":{"baz":5}}}'
		let jslob = await JSLOB.parse(str)
		let json = JSON.parse(str)
		assert.strictEqual(await jslob.foo.bar.baz,json.foo.bar.baz, '.foo.bar.baz should be set')
		assert.strictEqual(await jslob.foo.bar.bat,json.foo.bar.bat, '.foo.bar.bat should not be set')
		})

	// TODO: Anyway, it would be good if the factory exposes an option to control
	// this behavior, since the non-conforming behavior is more convenient
	// await test("Get > Deep nested access with intermediate undefined", async ()=>{
	// 	let str = '{"foo":{"bar":{"baz":5}}}'
	// 	let jslob = await JSLOB.parse(str)
	// 	let json = JSON.parse(str)
	// 	assert.strictEqual(
	// 		await caught(()=>jslob.foo.undef.baz),
	// 		await caught(()=> json.foo.undef.baz),
	// 		'.foo.undef.baz should throw an Error'
	// 		)
	// 	})


	await test("Get > Nested index access", async ()=>{
		let str = '[1,[2,4,6],3]'
		let jslob = await JSLOB.parse(str)
		let json = JSON.parse(str)
		assert.strictEqual(await jslob[1][1],json[1][1], '[1][1] should be set')
		assert.strictEqual(await jslob[2][1],json[2][1], '[2][1] should not be set')
		})

	await test("Stream in", async () => {
		let filepath = path.resolve(__dirname,'./sample.json')
		let json = fs.readFileSync(filepath)
		let jsonStream = fs.createReadStream(filepath)
		let jslob = await JSLOB.parse(jsonStream)

		assert.deepStrictEqual(
			JSON.parse(await JSLOB.stringify(jslob)),
			JSON.parse(json),
			'Streaming did not work as expected'
			)
		})

	}()

async function roundtrip(json,log){
	let jslob = await JSLOB.parse(json)
	let roundtrip = await JSLOB.stringify(jslob)
	let err = new Error('JSON parsing error')
	try{
		assert.deepStrictEqual(
			tryJsonParse(roundtrip, err),
			tryJsonParse(json, err),
			roundtrip
			)
		}
	catch(e){
		let {actual, expected} = e
		console.error({json, expected, roundtrip, actual})
		await JSLOB.log(jslob)
		throw "Roundtrip violation"
		}
	}

function tryJsonParse(str,dft){try{return JSON.parse(str)}catch(e){return dft}}

async function caught(fn){try{await fn()}catch(e){return true}}
async function caughtType(fn){try{await fn()}catch(e){return e.constructor.name}}
