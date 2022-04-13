window.addEventListener("DOMContentLoaded",()=>{
    chrome.storage.local.get(["start"],function(result){
        if(result.start) {
            document.getElementById("startBtn").classList.remove("bg-green-500")
            document.getElementById("startBtn").classList.add("bg-red-500")
            document.getElementById("startBtn").innerText = "停止填寫"
        }
    })
    
    chrome.storage.local.get(["datas"],function(result){
        console.log(result.datas)
    
        if(result.datas){
            document.getElementById("startBtn").addEventListener("click",()=>{
    
                chrome.storage.local.get(["start"],function(start_result){
                    if(start_result.start) {
                        chrome.storage.local.set({"start": false}, function(){
                            // console.log("setted!")
                            document.getElementById("startBtn").classList.remove("bg-red-500")
                            document.getElementById("startBtn").classList.add("bg-green-500")
                            document.getElementById("startBtn").innerText = "開始填寫"
                        })
                    } else {
                        const datas = {
                            total: result.datas.total,
                            content: document.getElementById("content").value,
                            works: result.datas.works,
                        }
                        chrome.storage.local.set({"datas": datas}, function(){
                            chrome.storage.local.set({"start": true}, function(){
                                // console.log("setted!")
                                document.getElementById("startBtn").classList.remove("bg-green-500")
                                document.getElementById("startBtn").classList.add("bg-red-500")
                                document.getElementById("startBtn").innerText = "停止填寫"
                            })
                        })
                    }
                    window.close()
                })
            })

            document.getElementById("clearBtn").addEventListener("click",()=>{
                chrome.storage.local.set({"clear": true}, function(){
                    // chrome.tabs.update({
                    //     url: "https://assistant.ncut.edu.tw/student/check-in/"
                    // });
                    window.close()
                })
            })
    
            document.getElementById("total").innerText = result.datas.total + " 小時"
            document.getElementById("start").innerText = result.datas.works[0].date
            document.getElementById("end").innerText = result.datas.works[result.datas.works.length-1].date
            document.getElementById("content").innerText = result.datas.content? result.datas.content: "協助計畫相關事務"
        }
    })
})