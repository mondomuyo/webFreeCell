//全局变量
var currentMove = 0;  //当前已经进行了的步数
var moves = [];  //用于储存已经进行过的操作，方便撤回，格式是3位16进制数字，第一位代表起点，第二位代表终点，第三位代表牌的数量
var cards = [];  //储存开局时扑克牌的排列顺序，格式为“花色-数字”
var freeCellStatus = [null, null, null, null];  //左上角空当位置是否有牌，null代表没有，否则储存牌的花色和数字。
var targetCellStatus = [0, 0, 0 ,0];  //右上角目标牌堆的扑克牌数，顺序是黑红梅方：spade, heart, club, diamond
var lines = [];  //是个二维数组，用来存放游戏进行时每一列的扑克牌顺序。
var suit = ["spade", "heart", "club", "diamond"];  //花色
var number = "A23456789XJQK";  //牌上的数字，X代表10。

//html里的div元素
var cardDivs = [];  //代表扑克牌的div
var lineDivs = [];  //代表牌堆的div
var freeCellDivs = []; //代表空当（左上角）的div
var targetCellDivs = [];  //代表目的牌堆（右上角）的div
var selectedCard = [];  //正在被拖动的扑克牌
var fromLine = null;  //正在被拖动的扑克牌原来所在的牌堆

//这两个用来计时
var interval = null;   //每秒执行一次
var beginTime = null;  //每局游戏开始时间


var getRndInteger = function(min, max) {                           //生成一个min（包括）到max（不包括）之间的随机数
    return Math.floor(Math.random() * (max - min) ) + min;
}

var shuffle = function(arr){
    for(var i = 0; i < arr.length - 1; i++) {
        var rand = getRndInteger(i, arr.length);
        var temp = arr[i];
        arr[i] = arr[rand];
        arr[rand] = temp;
    }
}

var initcards = function(){
    cards = [];
    for(var i = 0; i < suit.length; i++)
        for(var j = 0;j < number.length; j++)
            cards.push(suit[i] + "-" + number[j]);
    shuffle(cards);
}

var initlines = function(){
    for(var i = 0; i < 8; i++)
        lines[i] = new Array();
    for(var i = 0; i < cards.length; i++)
        lines[i % 8][Math.floor(i / 8)] = cards[i];
    
    freeCellStatus = [null, null ,null , null];
    targetCellStatus = [0, 0, 0, 0];
}

var displayCards = function(){
    for(var i = 0; i < lines.length; i++) {
        var linediv = document.getElementById("col" + i);
        for(var j = 0; j < lines[i].length; j++) {
            var childdiv = '<div id="' + lines[i][j] + '" class="card" style="background: url(images/' + lines[i][j] + '.jpg) no-repeat; background-size: cover; top: ' + 2.38 * j + 'vw; z-index = ' + j +'"></div>'
            linediv.innerHTML += childdiv;
        }
    }
}

var initAllDivs = function() {
    cardDivs = document.getElementsByClassName("card");
    lineDivs = document.getElementsByClassName("cardcolumn");
    freeCellDivs = document.getElementsByClassName("freecell");
    targetCellDivs = document.getElementsByClassName("targetcell");
}

var getCardColor = function(card) {
    switch(card[0]) {
        case 's':
            return 'black';  //spade
        case 'h':
            return 'red';  //heart
        case 'c':
            return 'black';  //club
        case 'd':
            return 'red';  //diamond
    }
}

var getCardNumber = function(card) {
    switch(card[card.length - 1]) {
        case 'A':
            return 1;
        case '2':
            return 2;
        case '3':
            return 3;
        case '4':
            return 4;
        case '5':
            return 5;
        case '6':
            return 6;
        case '7':
            return 7;
        case '8':
            return 8;
        case '9':
            return 9;
        case 'X':
            return 10;
        case 'J':
            return 11;
        case 'Q':
            return 12;
        case 'K':
            return 13;
    }
}

var checkSelectable = function() {
    for(var i = 1; i < selectedCard.length; i++) {
        if(getCardColor(selectedCard[i].id) == getCardColor(selectedCard[i - 1].id))
            return false;
        if(getCardNumber(selectedCard[i].id) != getCardNumber(selectedCard[i - 1].id) - 1)
            return false;
    }
    return true;
}

var checkMoveable = function(line) {
    if(line.length == 0)
        return true;
    if(getCardNumber(line[line.length - 1]) != getCardNumber(selectedCard[0].id) + 1)
        return false;
    if(getCardColor(line[line.length - 1]) == getCardColor(selectedCard[0].id))
        return false;
    return true;
}

var checkWin = function() {
    if(targetCellStatus[0] == 13 && targetCellStatus[1] ==13)
        if(targetCellStatus[2] == 13 && targetCellStatus[3] ==13) {
            alert("恭喜恭喜，你赢了！");
            alert("本次所用时间：" + getElementById("time").innerHTML);
        }
}

var enableDragging = function() {
    for(var i = 0; i < cardDivs.length; i++) {
        cardDivs[i].onmousedown = function(e) {
            var mouse = e || event;
            var deltaX = [];   //mouse.clientX - this.offsetLeft;
            var deltaY = [];   //mouse.clientY - this.offsetTop;
            selectedCard.push(this);
            deltaX.push(mouse.clientX - selectedCard[0].offsetLeft);
            deltaY.push(mouse.clientY - selectedCard[0].offsetTop);
            selectedCard[0].style.zIndex = 100;
            fromLine = this.parentNode;

            var lastUnselected;
            //将这一列剩余的牌都选中
            if(fromLine.className == "cardcolumn") {
                var index = fromLine.id[fromLine.id.length - 1];
                for(var j = 0; j < lines[index].length; j++) {
                    if(lines[index][j] == selectedCard[0].id) {
                        lastUnselected = j;
                        for(var k = j + 1; k < lines[index].length; k++) {
                            selectedCard.push(document.getElementById(lines[index][k]));
                            deltaX.push(mouse.clientX - selectedCard[k - j].offsetLeft);
                            deltaY.push(mouse.clientY - selectedCard[k - j].offsetTop);
                            selectedCard[k - j].style.zIndex = 100 + k - j;
                        }
                        break;
                    }
                }
            }

            //目标牌堆的牌不能再移动
            if(fromLine.className == "targetcell") {
                selectedCard[0].style.zIndex = targetCellStatus[fromLine.id[fromLine.id.length - 1]];
                selectedCard = [];
                fromLine = null;
                return;
            }

            if(!checkSelectable()) {
                for(var j = 0; j < selectedCard.length; j++) {
                    selectedCard[j].style.zIndex = lastUnselected + j;
                }
                selectedCard = [];
                return;
            }

            document.onmousemove = function(e) {
                var mouse = e || event;
                for(var i = 0; i < selectedCard.length; i++) {
                    selectedCard[i].style.left = mouse.clientX - deltaX[i] + 'px';
                    selectedCard[i].style.top = mouse.clientY - deltaY[i] + 'px';
                }
            };
        };
    }

    document.onmouseup = function(e) {
        //如果没有牌被选中。。
        if(selectedCard.length == 0)
            return;
        
        var mouse = e || event;

        //如果牌被移到了空当。。
        for(var i = 0; i < freeCellDivs.length; i++) {
            if(freeCellStatus[i] != null)
                continue;
            if(selectedCard.length > 1)
                break;
            if(freeCellDivs[i].offsetLeft <= mouse.clientX && mouse.clientX <= freeCellDivs[i].offsetLeft + freeCellDivs[i].offsetWidth)
                if(freeCellDivs[i].offsetTop <= mouse.clientY && mouse.clientY <= freeCellDivs[i].offsetTop + freeCellDivs[i].offsetHeight) {
                    freeCellDivs[i].appendChild(selectedCard[0]);
                    if(fromLine.className == "cardcolumn")
                        lines[fromLine.id[fromLine.id.length - 1]].pop();
                    else
                        freeCellStatus[fromLine.id[fromLine.id.length - 1]] = null;
                    freeCellStatus[i] = selectedCard[0].id;
                    selectedCard[0].style.left = 0;
                    selectedCard[0].style.top = 0;
                    selectedCard[0].style.zIndex = 0;
                    fromLine = null;
                    selectedCard = [];
                    document.onmousemove = null;
                    m
                    return;
                }
        }
        //直接返回

        //如果牌被移到了目的地。。
        for(var i = 0; i < targetCellDivs.length; i++) {
            if(selectedCard.length > 1)
                break;
            if(targetCellDivs[i].offsetLeft <= mouse.clientX && mouse.clientX <= targetCellDivs[i].offsetLeft + targetCellDivs[i].offsetWidth)
                if(targetCellDivs[i].offsetTop <= mouse.clientY && mouse.clientY <= targetCellDivs[i].offsetTop + targetCellDivs[i].offsetHeight) {
                    var j;
                    switch(selectedCard[0].id[0]) {
                        case 's':
                            j = 0; break;    //spade
                        case 'h':
                            j = 1; break;    //heart
                        case 'c':
                            j = 2; break;    //club
                        case 'd':
                            j = 3; break;    //diamond
                    }
                    if(getCardNumber(selectedCard[0].id) != targetCellStatus[j] + 1)
                        break;
                    targetCellDivs[j].appendChild(selectedCard[0]);
                    targetCellStatus[j] += 1;
                    if(fromLine.className == "cardcolumn")
                        lines[fromLine.id[fromLine.id.length - 1]].pop();
                    else
                        freeCellStatus[fromLine.id[fromLine.id.length - 1]] = null;
                    selectedCard[0].style.left = 0;
                    selectedCard[0].style.top = 0;
                    selectedCard[0].style.zIndex = targetCellStatus[j];
                    fromLine = null;
                    selectedCard = [];
                    document.onmousemove = null;
                    checkWin();
                    return;
            }
        }
        //直接返回

        //如果牌被移到了另一个牌堆。。
        for(var i = 0; i < lineDivs.length; i++) {
            if(lineDivs[i].offsetLeft <= mouse.clientX && mouse.clientX <= lineDivs[i].offsetLeft + lineDivs[i].offsetWidth)
                if(lineDivs[i].offsetTop <= mouse.clientY && mouse.clientY <= lineDivs[i].offsetTop + lineDivs[i].offsetHeight) {
                    
                    if(!checkMoveable(lines[i]))
                        break;
                    if(fromLine.className == "cardcolumn"){
                        if(i == fromLine.id[fromLine.id.length - 1])
                            break;
                        for(var j = 0; j < selectedCard.length; j++) {
                            lineDivs[i].appendChild(selectedCard[j]);
                            lines[i].push(selectedCard[j].id);
                            lines[fromLine.id[fromLine.id.length - 1]].pop();
                            selectedCard[j].style.left = 0;
                            selectedCard[j].style.top = (lines[i].length - 1) * 2.38 + 'vw';
                            selectedCard[j].style.zIndex = lines[i].length - 1;
                        }
                    }
                    else {
                        lineDivs[i].appendChild(selectedCard[0]);
                        lines[i].push(freeCellStatus[fromLine.id[fromLine.id.length - 1]]);
                        freeCellStatus[fromLine.id[fromLine.id.length - 1]] = null;
                        selectedCard[0].style.left = 0;
                        selectedCard[0].style.top = (lines[i].length - 1) * 2.38 + 'vw';
                        selectedCard[0].style.zIndex = lines[i].length - 1;
                    }
                    fromLine = null;
                    selectedCard = [];
                    document.onmousemove = null;
                    return;
                }
        }
        //直接返回

        //如果牌没有动。。
        if(fromLine.className == "cardcolumn") {
            var index = fromLine.id[fromLine.id.length - 1];
            for(var j = 0; j < lines[index].length; j++) {
                if(lines[index][j] == selectedCard[0].id) {
                    for(var k = 0; k < selectedCard.length; k++) {
                        selectedCard[k].style.left = 0;
                        selectedCard[k].style.top = (j + k) * 2.38 + 'vw';
                        selectedCard[k].style.zIndex = j + k;
                    }
                    break;
                }
            }
        }
        else {
            selectedCard[0].style.left = 0;
            selectedCard[0].style.top = 0;
            selectedCard[0].style.zIndex = 0;
        }
        fromLine = null;
        selectedCard = [];
        document.onmousemove = null;
        return;
        //直接返回
    }
}

var clear = function() {
    for(var i = cardDivs.length - 1; i >= 0; i--)
        cardDivs[i].parentNode.removeChild(cardDivs[i]);
    lines = [];
    freeCellStatus = [null, null, null, null];
    targetCellStatus = [0, 0 , 0, 0];
    cardDivs = [];
    lineDivs = [];
    freeCellDivs = [];
    targetCellDivs = [];
}

var startGame = function() {
    initlines();
    displayCards();
    initAllDivs();
    enableDragging();
    beginTime = new Date();
}

var init = function(){
    initcards();
    initlines();
    displayCards();
    initAllDivs();
    enableDragging();
    beginTime = new Date();
}

var numberToStr = function(number){
    if(number < 10)
        return '0' + number;
    return '' + number;
}

window.onload = function(){
    var resetBtn = document.getElementById("reset");
    var newLevelBtn = document.getElementById("new level");
    var backwardBtn = document.getElementById("backward");
    var forwardBtn = document.getElementById("forward");

    resetBtn.onclick = function(){
        if(confirm("确定要重玩本关吗？") == true) {
            clear();
            startGame();
        }
    }

    newLevelBtn.onclick = function(){
        if(confirm("确定要开始新关卡吗？") == true) {
            shuffle(cards);
            clear();
            startGame();
        }
    }

    interval = setInterval(function() {
        var nowTime = new Date();
        var usedTime = nowTime - beginTime;
        str = '';
        usedTime = usedTime / 1000; //seconds
        var hours = Math.floor(usedTime / 3600);
        usedTime = usedTime % 3600;
        var minutes = Math.floor(usedTime / 60);
        usedTime = usedTime % 60;
        var seconds = Math.floor(usedTime);
        str = '' + numberToStr(hours) + ':' + numberToStr(minutes) + ':' + numberToStr(seconds);
        var timeEle = document.getElementById("time");
        timeEle.innerHTML = str;
    }, 1000);

    init();

}