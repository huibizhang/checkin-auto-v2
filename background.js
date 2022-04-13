var works = []
var content = "協助計畫相關事務"
var total = 0
var doCount = 21
var listCount = 50
var processCount = 0

function getRandom(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function cleaner(){
	var clear = null
	
	chrome.storage.local.get(["clear"],function(result){
		clear = result.clear

		if(clear){
			if(!$("#clean-progress-cover").get(0)){
				$("body").append(`
					<div id="clean-progress-cover" style="width:100vw;height:100vh;z-index:9999;position:fixed;top:0;left:0;display:flex;justify-content:center;align-items:center;">
						<div style="width:100%;height:100%;background-color:rgba(0,0,0,0.5)"></div>
						<div style="background-color:white;position:absolute;width:300px;height:300px;display:flex;justify-content:center;align-items:center;font-size:20px;flex-direction:column;gap:20px;border-radius:5%;">
							<span>清除中，請稍後...</span>
							<span id="progressText"></span>
							<progress
								id="progressBar"
								min="0"
								max="100"
								value="0"
							></progress>
						</div>
					</div>
				`)
			}

			chrome.storage.local.clear()
			const dels = $(".table.table-borderless.table-hover tbody tr form")
			
			listCount = dels.length
			doCount = 0
			
			$("#clean-progress-cover #progressBar").get(0).max = listCount
			
			for(let i=0;i<dels.length;i++){
				const data = {
					_token: $('#logout-form input[name="_token"]').get(0).value,
					_method: "DELETE"
				}
				$.post(
					dels[i].getAttribute("action"),
					data
				)
				.success(function() {
					console.log(`deleted: ${dels[i].getAttribute("action")}`)
					doCount++
					$("#clean-progress-cover #progressBar").get(0).value = doCount
					$("#clean-progress-cover #progressText").get(0).innerText = Math.round(doCount*100/listCount) + "%"
					
					if(doCount===listCount){
						window.history.go(0)
					}
				})
				.error(function() {
					console.log("error")
				})
			}
		}else {
			console.log("cleaner running")
			setTimeout(cleaner,500)
		}
	})
}

function trigger(){
	// const start_json = JSON.parse(chrome.storage.local.get("start"))
	var start_json = null
	
	chrome.storage.local.get(["start"],function(result){
		start_json = result.start

		if(start_json) {
			if(!$("#progress-cover").get(0)){
				$("body").append(`
					<div id="progress-cover" style="width:100vw;height:100vh;z-index:9999;position:fixed;top:0;left:0;display:flex;justify-content:center;align-items:center;">
						<div style="width:100%;height:100%;background-color:rgba(0,0,0,0.5)"></div>
						<div style="background-color:white;position:absolute;width:300px;height:300px;display:flex;justify-content:center;align-items:center;font-size:20px;flex-direction:column;gap:20px;border-radius:5%;">
							<span>填表中，請稍後...</span>
							<span id="progressText"></span>
							<progress
								id="progressBar"
								min="0"
								max="100"
								value="0"
							></progress>
						</div>
					</div>
				`)
			}

			const list = works.filter(w => !w.filled && w.count>0)

			console.log(list)

			listCount = list.length
			doCount = 0
			processCount = 0

			$("#progress-cover #progressBar").get(0).max = listCount
			$("#progress-cover #progressBar").get(0).value = doCount

			list.forEach(w => {
				const dates = w.date.split("-")
				const data = {
					_token: $('#logout-form input[name="_token"]').get(0).value,
					holiday_id: 1,
					shift_id: w.type,
					work_day: Math.floor( new Date(Date.UTC(parseInt(dates[0]),parseInt(dates[1])-1,parseInt(dates[2]),-8,0,0)).getTime() / 1000 ),
					check_in: w.check_in,
					check_out: w.check_out,
					content: content,
				}

				$.post(
					"/student/check-in",
					data
				)
				.success(function() {
					works[w.index].filled = true
					doCount++
					$("#progress-cover #progressBar").get(0).value = doCount
					$("#progress-cover #progressText").get(0).innerText = Math.round(doCount*100/listCount) + "%"
				})
				.error(function() {
					console.log("error")
				})
				.complete(function (XMLHttpRequest, textStatus) {
					processCount++
				})
			})

			waitForPenfing()

			// const url = works.filter(w => !w.filled && w.count>0)[0]
			// if(url){
			// 	window.location = `https://assistant.ncut.edu.tw/student/check-in/create/${url.date}/${url.type}`
			// } else {
			// 	alert("填寫完成!")
			// }
		}else {
			console.log("timer running")
			setTimeout(trigger,500)
		}
	})
}

function waitForPenfing(){

	if(doCount===listCount && doCount!==0){
		chrome.storage.local.set({"start": false}, function(){
			window.history.go(0)
		})
	} else {
		console.log("Wait For Penfing")

		if(processCount===listCount && processCount!==0){
			console.log("處理完畢")
			trigger()
			return
			//return
		}

		setTimeout(waitForPenfing,500)
	}
}

function main(works_json) {
	if(!works_json){
		const table = $(".table.table-borderless.table-hover tbody tr")
		for(let i=0;i<table.length-1;i++){
			const td = table[i].getElementsByTagName("td")

			const work = {
				typeName: td[2].innerText,
				type: {
					"早班": 1,
					"午班": 2,
					"晚班": 3,
				}[td[2].innerText],
				date: td[3].innerText,
				index: i,
				filled: false,
				count: 0,
				check_in: "",
				check_out: "",
				isHoliday: isHoliday(td[3].innerText)
			}

			if(!work.isHoliday){
				works.push(work)
			}
		}

		if($(".table.table-borderless.table-hover tbody tr li").get(0).innerText.indexOf("本月限制時數上限：")===-1){
			total = parseInt($(".table.table-borderless.table-hover tbody tr li").get(1).innerText.replace("本月限制時數上限：",""))
		} else {
			total = parseInt($(".table.table-borderless.table-hover tbody tr li").get(0).innerText.replace("本月限制時數上限：",""))
		}

		// total = 142
		console.log(works,total)

		// 早班
		var morningTotal = 0
		const morning = works.filter(w => w.type===1)
		for([index,value] of Object.entries(morning)){
			const w = value
			var count = morningTotal+4 <= total? 4: (total - morningTotal)
			
			works[w.index].count = count
			
			works[w.index].check_in = `${(12-count-1)<10 && "0"}${12-count-1}:${getRandom(55,59)}`
			works[w.index].check_out = `12:0${getRandom(1,5)}`

			if(index===1) {
				while(works[w.index].check_in === works[w.index-3].check_in){
					works[w.index].check_in = `${(12-count-1)<10 && "0"}${12-count-1}:${getRandom(55,59)}`
				}
				while(works[w.index].check_out === works[w.index-3].check_out){
					works[w.index].check_out = `12:0${getRandom(1,5)}`
				}

			} else if(index>=2) {
				while(!(works[w.index].check_in !== works[w.index-3].check_in && works[w.index].check_in !== works[w.index-6].check_in)){
					works[w.index].check_in = `${(12-count-1)<10 && "0"}${12-count-1}:${getRandom(55,59)}`
				}
				while(!(works[w.index].check_out !== works[w.index-3].check_out && works[w.index].check_out !== works[w.index-6].check_out)){
					works[w.index].check_out = `12:0${getRandom(1,5)}`
				}
			}

			morningTotal += count
			if(count<4) break
		}

		// 午班
		var noonTotal = 0
		const noon = works.filter(w => w.type===2)
		for([index,value] of Object.entries(noon)){
			const w = value
			var count = morningTotal+noonTotal+3 <= total? 3: (total - morningTotal - noonTotal)
			
			works[w.index].count = count
			
			works[w.index].check_in = `12:${getRandom(55,59)}`
			works[w.index].check_out = `${12+count+1}:0${getRandom(1,5)}`

			if(index===1) {
				while(works[w.index].check_in === works[w.index-3].check_in){
					works[w.index].check_in = `12:${getRandom(55,59)}`
				}
				while(works[w.index].check_out === works[w.index-3].check_out){
					works[w.index].check_out = `${12+count+1}:0${getRandom(1,5)}`
				}

			} else if(index>=2) {
				while(!(works[w.index].check_in !== works[w.index-3].check_in && works[w.index].check_in !== works[w.index-6].check_in)){
					works[w.index].check_in = `12:${getRandom(55,59)}`
				}
				while(!(works[w.index].check_out !== works[w.index-3].check_out && works[w.index].check_out !== works[w.index-6].check_out)){
					works[w.index].check_out = `${12+count+1}:0${getRandom(1,5)}`
				}
			}

			noonTotal += count
			if(count<3) break
		}

		window.localStorage.setItem("works",JSON.stringify(works))
		chrome.storage.local.set({"datas": {
			"total": total,
			"works": works
		}}, function(){
			console.log("setted!")
		})
	} else {
		works = works_json
	}

	console.log(works.filter(w => w.type===1).map(w => [w.check_in, w.check_out]))
	// console.log(works.filter(w => w.type===2 && w.count>0).map(w => [w.check_in, w.check_out]))

	trigger()
	cleaner()
}

isHoliday = (date) => {
	const weekday = new Date(date).getDay();
	return weekday===0 || weekday===6 || (holidays.find(d => d.Date === date.replace(/-/g,'')) ?? false)
}


// main

const my_url=document.location.href;

if(my_url==="https://assistant.ncut.edu.tw/student/check-in"){
	/*var theCookies = document.cookie.split(';');
	var L;*/
	$(document).ready(function() {

		// const works_json = JSON.parse(window.localStorage.getItem("works"))
		var works_json = null

		chrome.storage.local.get(["datas"],function(result){
			works_json = result.datas? result.datas.works: null
			content = result.datas? result.datas.content: "協助計畫相關事務"
			main(works_json)
		})
	})
} else if (my_url.indexOf("https://assistant.ncut.edu.tw/student/check-in/create/"===0)) {

	// chrome.storage.local.get(["datas"],function(result){
	// 	works = result.datas? result.datas.works: null
		
	// 	const list = works.filter(w => !w.filled && w.count>0)

	// 	list.forEach(w => {
	// 		const data = {
	// 			_token: $('#logout-form input[name="_token"]').get(0).value,
	// 			holiday_id: 1,
	// 			shift_id: 1,
	// 			work_day: new Date(w.date).getTime(),
	// 			check_in: w.check_in,
	// 			check_out: w.check_out,
	// 			content: "協助計畫相關事務",
	// 		}

	// 		$.post(
	// 			"/student/check-in",
	// 			data
	// 		)
	// 		.success(function() { console.log("second success"); })
	// 		.error(function() { console.log("error"); })
	// 	})
	// })
}