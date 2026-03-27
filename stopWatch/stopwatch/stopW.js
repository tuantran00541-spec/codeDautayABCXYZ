let seconds = 0;
let minutes = 0;
let hour =  0;
let timer = null;

function updateDisplay(){
    const h = hour < 10 ? '0' + hour : hour;
    const m = minutes < 10 ? '0' + minutes : minutes;
    const s = seconds < 10 ? '0' + seconds : seconds;
    document.getElementById("display").innerText = `${h}:${m}:${s}`;
}

function starTimer(){
    timer = setInterval(()=>{

        seconds++;
        if(seconds === 60){
            seconds = 0;
            minutes++;
        }

        if(minutes === 60){
            minutes = 0;
            hour++;
        }
        updateDisplay()
    }, 1000)
}
function toggletimer(){
    const icon = document.getElementById("toggleIcon")
    const text = document.getElementById("toggleText")
    
    if(timer == null){;
        starTimer();
        icon.className = "fa-solid fa-pause";
        text.innerText = "pause";
    }else{
        stopTimer()
    }
}

function stoptimer(){
    clearInterval(timer);
    timer = null;
    document.getElementById("toggleIcon").className = "fa-solid fa-play";       
    document.getElementById("toggleText").innerText = "star";
}

function resetTimer(){
    stoptimer();
    seconds = minutes = hour = 0;
    updateDisplay();
}