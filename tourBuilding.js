var krpano;
let jsonList;
var currentVideoNode; //Which element current video is in jsonList 
var currentVideoNodeId; //Videos nodeId written in jsonList
var autoEndNextNodeId;
var currentToolNode;
var currentToolNodeId;
var answerButtonCount = 0;
var screenButtonCount = 0;
var videoHasEnded = false;
var score = 0;
var maxScore = 0;
var videosFound = 0;
var toolNodeFilesChecked = 0;
var currentFolderName = "";
var popUpOpen = false;
const timerArray = [];
const actionShowArray = [];
const actionHideArray = [];
const actionTimeIds = [];
const answerArray = [];
const screenButtons = [];

function getDemoData(){
    document.getElementById("errorStatus").innerHTML = "Missing files:";
    document.getElementById("errorStatus").style.visibility = "hidden";
    document.getElementById("materialCheckStatus").style.visibility = "hidden";
    document.getElementById("materialCheckStatus2").style.visibility = "hidden";
    document.getElementById("startLabel").style.visibility = "hidden";
    videosFound = 0;
    toolNodeFilesChecked = 0;

    document.getElementById("loadText").innerHTML = "Using demo data";

    let myRequest = new Request("./tours/Postoperative_care_in_recovery_room_4k/Postoperative_careV8.json");

    fetch(myRequest)
        .then(function(resp){
            return resp.json();
        })
        .then(function(data){
            startJsonCheck(data);
        })
}

function importFiles(){
    document.getElementById("errorStatus").innerHTML = "Missing files:";
    document.getElementById("errorStatus").style.visibility = "hidden";
    document.getElementById("materialCheckStatus").style.visibility = "hidden";
    document.getElementById("materialCheckStatus2").style.visibility = "hidden";
    document.getElementById("startLabel").style.visibility = "hidden";
    videosFound = 0;
    toolNodeFilesChecked = 0;
    
    var files = document.getElementById('jsonInput').files[0];
	if (files.length <= 0) {
		return false;
	}
		
	var fr = new FileReader();
		
	fr.onload = function(){
		var fileContent = JSON.parse(fr.result);
		startJsonCheck(fileContent);
	};
	fr.readAsText(files);
};

function startJsonCheck(list){
    jsonList = list;
	document.getElementById('import').innerHTML = "Done";
    currentFolderName = "";

    if(!jsonList.folderName || jsonList.folderName == ''){
        document.getElementById("errorStatus").style.visibility = "visible";
        document.getElementById("errorStatus").innerHTML = "Error: Tour folder name not defined, using default folder";
        currentFolderName = "Postoperative_care_in_recovery_room_4k";
    }else{
        currentFolderName = jsonList.folderName;
    }

    document.getElementById("materialCheckStatus").style.visibility = "visible";
    document.getElementById("materialCheckStatus").innerHTML = "Video nodes in order: " + videosFound + "/" + jsonList.videos.length;
    for(let i = 0; i < jsonList.videos.length; i++){
        checkIfVideoExists(i);
    }

    document.getElementById("materialCheckStatus2").style.visibility = "visible";
    document.getElementById("materialCheckStatus2").innerHTML = "Material nodes in order: " + toolNodeFilesChecked + "/" + jsonList.tools.length * 2;
    for(let i = 0; i < jsonList.tools.length; i++){
        checkIfToolFilesExists(i);
    }
};

function updateVideoCheckStatus(){
    videosFound++;
    document.getElementById("materialCheckStatus").innerHTML = "Video nodes in order: " + videosFound + "/" + jsonList.videos.length;

    if(toolNodeFilesChecked == 2 * jsonList.tools.length && videosFound == jsonList.videos.length){
        document.getElementById("startLabel").style.visibility = "visible";
        //document.getElementById("startDebugLabel").style.visibility = "visible";
    }
};

function checkIfVideoExists(node){
    var http = new XMLHttpRequest();
    var src = './tours/' + currentFolderName + '/' + jsonList.videos[node].videoFileName;
    http.open('HEAD', src);

    http.onreadystatechange = function() {
        if (this.readyState == this.DONE) {
            if (this.status != 404) {
                updateVideoCheckStatus();
            }
            else{
                document.getElementById("errorStatus").style.visibility = "visible";
                document.getElementById("errorStatus").innerHTML += "<br>" + jsonList.videos[node].videoFileName;
            }
        }
    };

    http.send();
};

function checkIfToolFilesExists(node){
    if(jsonList.tools[node].spritePath != ""){
        var http = new XMLHttpRequest();
        var src = './tours/' + currentFolderName + '/' + jsonList.tools[node].spritePath;
        http.open('HEAD', src);

        http.onreadystatechange = function() {
            if (this.readyState == this.DONE) {
                if (this.status != 404) {
                    updateToolNodeCheckStatus();
                }
                else{
                    document.getElementById("errorStatus").style.visibility = "visible";
                    document.getElementById("errorStatus").innerHTML += "<br>" + jsonList.tools[node].spritePath;
                }
            }
        };

        http.send();
    }
    else{
        updateToolNodeCheckStatus();
    }

    if(jsonList.tools[node].video2Dpath != ""){
        var http = new XMLHttpRequest();
        var src = './tours/' + currentFolderName + '/' + jsonList.tools[node].video2Dpath;
        http.open('HEAD', src);

        http.onreadystatechange = function() {
            if (this.readyState == this.DONE) {
                if (this.status != 404) {
                    updateToolNodeCheckStatus();
                }
                else{
                    document.getElementById("errorStatus").style.visibility = "visible";
                    document.getElementById("errorStatus").innerHTML += "<br>" + jsonList.tools[node].video2Dpath;
                }
            }
        };

        http.send();
    }
    else{
        updateToolNodeCheckStatus();
    }
};

function updateToolNodeCheckStatus(){
    toolNodeFilesChecked++;
    document.getElementById("materialCheckStatus2").innerHTML = "Tool nodes in order: " + toolNodeFilesChecked + "/" + jsonList.tools.length * 2;

    if(toolNodeFilesChecked == 2 * jsonList.tools.length && videosFound == jsonList.videos.length){
        document.getElementById("startLabel").style.visibility = "visible";
        //document.getElementById("startDebugLabel").style.visibility = "visible";
    }
};

function krpanoReady(){
    krpano = document.getElementById("krpanoSWFObject");
};

function startSimulation(){
    document.getElementById("upload").style.display = "none";
    score = 0;
    maxScore = 0;
    getNodeData(jsonList.startId);
};

function enableDebugTools(){
    krpano.call("set(layer[layer_video_time].visible, true);");
    krpano.call("set(layer[layer_video_time_percent].visible, true);");
    krpano.call("set(layer[layer_scene_time].visible, true);");

    krpano.call("set(layer[button_toggle_play].visible, true);");
    krpano.call("set(layer[button_toggle_play].enabled, true);");
}

function print(s){
    console.log(s);
};

function getNodeData(id){
    if(id == -1){
        endSimulation();
    }
    for (let i = 0; i < jsonList.videos.length; i++){
        if (jsonList.videos[i].nodeId == id){
            cancelActionVisibilityCalls();
            sceneChangeInProgress = 1;
            currentVideoNode = i;
            currentVideoNodeId = id;
            openVideoNode(currentVideoNode);
        }
    }
    for (let j = 0; j < jsonList.tools.length; j++){
        if (jsonList.tools[j].nodeId == id){
            currentToolNode = j;
            currentToolNodeId = id;
            openQuestionSheet();
            hideScreenButtons();
        }
    }
};

function openVideoNode(element){
    resetTimer();
    resetTimerArray();
    screenButtonCount = 0;
    videoHasEnded = false;
    var horizontalRotation = jsonList.videos[element].videoStartRotation.y - 90;
    var startTime = jsonList.videos[element].startTime * 100;
    startTime = startTime + "%";
    var videoFileNameCall = "newVideoScene(" + element + ", 'tours/"+ currentFolderName +"/" + jsonList.videos[element].videoFileName + "', " + horizontalRotation + ", " 
    + jsonList.videos[element].videoStartRotation.x + ", " + startTime + ", " + jsonList.videos[element].endTime + ");";
    krpano.call(videoFileNameCall);
};

function videoEnded(id){
    if(id != currentVideoNode){
        return;
    }
    if(jsonList.videos[currentVideoNode].loop == true){
        krpano.call("plugin[video].seek(get(plugin[video].starttime));");
        krpano.call("set(plugin[video].timepercent, 0);");
        krpano.call("callwhen(plugin[video].time GE plugin[video].endtimeseconds, js(videoEnded(" + currentVideoNode + ")));");
        krpano.call("plugin[video].play();");

        callActionVisibilityCalls();
    }
    else{
        krpano.call("plugin[video].pause();");
        videoHasEnded = true;
    }
    if(autoEndNextNodeId != -2){
        getNodeData(autoEndNextNodeId);
    }
};

function videoPaused(){
    if(videoHasEnded) return;

    pauseTimer();

    if(popUpOpen) return;

    krpano.call("set(layer[pause_layer].enabled, true);");
    krpano.call("set(layer[pause_layer].visible, true);");
};

function unPauseVideo(){
    if(videoHasEnded) return;

    krpano.call("plugin[video].play();");

    krpano.call("set(layer[pause_layer].enabled, false);");
    krpano.call("set(layer[pause_layer].visible, false);");
}

function createHotspots(){
    autoEndNextNodeId = -2;
    actionShowArray.length = 0;
    actionHideArray.length = 0;
    actionTimeIds.length = 0;
    screenButtons.length = 0;
    for(let i = 0; i < jsonList.videos[currentVideoNode].actions.length; i++){
        if(jsonList.videos[currentVideoNode].actions[i].actionType == 4){
            // var timerId = "timer" + currentVideoNode + "_" + i;
            // timerArray.push(timerId);
            // var timerActionCall = "delayedcall(" + timerId + ", " + jsonList.videos[currentVideoNode].actions[i].timer + ", js(getNodeData(" + 
            // jsonList.videos[currentVideoNode].actions[i].nextNode + ")));";
            // krpano.call(timerActionCall);

             var timerActionCall = "js(getNodeData(" + jsonList.videos[currentVideoNode].actions[i].nextNode + "));";
             createNewTimer(jsonList.videos[currentVideoNode].actions[i].timer, timerActionCall);
        }
        else if(jsonList.videos[currentVideoNode].actions[i].actionType == 0){
            if(jsonList.videos[currentVideoNode].actions[i].autoEnd == true){
                autoEndNextNodeId = jsonList.videos[currentVideoNode].actions[i].nextNode;
            }
            else{
                var layerCreationCall = 'createScreenButton(' + currentVideoNode + i + ', ' + screenButtonCount + ', ' + 
                jsonList.videos[currentVideoNode].actions[i].actionText + ', ' + jsonList.videos[currentVideoNode].actions[i].nextNode + 
                ', "' + getScreenButtonStyle(jsonList.videos[currentVideoNode].actions[i].nextNode) + '")';
                krpano.call(layerCreationCall);
                screenButtons.push("screenButton"+currentVideoNode+i);
                screenButtonCount++;

                var layerCallWhenId1 = "lashow" + currentVideoNode + i;
                var layerCallWhenId2 = "lahide" + currentVideoNode + i;
                var layerShowCall = "callwhen(" + layerCallWhenId1 + ", plugin[video].timepercent GE " + jsonList.videos[currentVideoNode].actions[i].startTime + ", set(layer[screenButton" + currentVideoNode + i + "].visible, true); set(layer[screenButton" + currentVideoNode + i + "].enabled, true););";
                var layerHideCall = "callwhen(" + layerCallWhenId2 + ", plugin[video].timepercent GE " + jsonList.videos[currentVideoNode].actions[i].endTime + ", set(layer[screenButton" + currentVideoNode + i + "].visible, false); set(layer[screenButton" + currentVideoNode + i + "].enabled, false););";
                actionShowArray.push(layerShowCall);
                actionHideArray.push(layerHideCall);
                actionTimeIds.push(layerCallWhenId1);
                actionTimeIds.push(layerCallWhenId2);
            }
        }
        else if(jsonList.videos[currentVideoNode].actions[i].actionType == 3){
            var point0Ath = getPointAth(i, 0);
            var point0Atv = getPointAtv(i, 0);
            var point1Ath = getPointAth(i, 1);
            var point1Atv = getPointAtv(i, 1);
            var point2Ath = getPointAth(i, 2);
            var point2Atv = getPointAtv(i, 2);
            var point3Ath = getPointAth(i, 3);
            var point3Atv = getPointAtv(i, 3);

            var hotspotCreationCall = 'createPolyHotspot(' + currentVideoNode + i + ', ' + jsonList.videos[currentVideoNode].actions[i].nextNode + ', ' + 
            '"' + getNodeStyle(jsonList.videos[currentVideoNode].actions[i].nextNode)+'_polyspot' + '", "' + jsonList.videos[currentVideoNode].actions[i].actionText +'", ' + 
            point0Ath + ', ' + point0Atv +  ', ' + 
            point1Ath + ', ' + point1Atv +  ', ' + 
            point2Ath + ', ' + point2Atv +  ', ' + 
            point3Ath + ', ' + point3Atv +  
            ');';
            //console.log(hotspotCreationCall);
            krpano.call(hotspotCreationCall);
            
            var hotspotCallWhenId1 = "hsshow" + currentVideoNode + i;
            var hotspotCallWhenId2 = "hshide" + currentVideoNode + i;
            var hotspotShowCall = "callwhen(" + hotspotCallWhenId1 + ", plugin[video].timepercent GE " + jsonList.videos[currentVideoNode].actions[i].startTime + ", set(hotspot[hotspot" + currentVideoNode + i + "].visible, true); set(hotspot[hotspot" + currentVideoNode + i + "].enabled, true););";
            var hotspotHideCall = "callwhen(" + hotspotCallWhenId2 + ", plugin[video].timepercent GE " + jsonList.videos[currentVideoNode].actions[i].endTime + ", set(hotspot[hotspot" + currentVideoNode + i + "].visible, false); set(hotspot[hotspot" + currentVideoNode + i + "].enabled, false););";
            actionShowArray.push(hotspotShowCall);
            actionHideArray.push(hotspotHideCall);
            actionTimeIds.push(hotspotCallWhenId1);
            actionTimeIds.push(hotspotCallWhenId2);
        }
        else if(jsonList.videos[currentVideoNode].actions[i].actionType == 2){
            var hotspotCreationCall = 'createFloorHotspot(' + currentVideoNode + i + ', ' + getActionAth(i) + ', ' + getActionAtv(i) + ', ' + 
            jsonList.videos[currentVideoNode].actions[i].nextNode + ',"sprites/icon_circle.png" , "' + 
            getNodeStyle(jsonList.videos[currentVideoNode].actions[i].nextNode) + '", "'+ jsonList.videos[currentVideoNode].actions[i].actionText 
            + '", "'+ (90 - getActionAtv(i)) +'");';
            krpano.call(hotspotCreationCall);

            //console.log(hotspotCreationCall);
            
            var hotspotCallWhenId1 = "hsshow" + currentVideoNode + i;
            var hotspotCallWhenId2 = "hshide" + currentVideoNode + i;
            var hotspotShowCall = "callwhen(" + hotspotCallWhenId1 + ", plugin[video].timepercent GE " + jsonList.videos[currentVideoNode].actions[i].startTime + ", set(hotspot[hotspot" + currentVideoNode + i + "].visible, true); set(hotspot[hotspot" + currentVideoNode + i + "].enabled, true););";
            var hotspotHideCall = "callwhen(" + hotspotCallWhenId2 + ", plugin[video].timepercent GE " + jsonList.videos[currentVideoNode].actions[i].endTime + ", set(hotspot[hotspot" + currentVideoNode + i + "].visible, false); set(hotspot[hotspot" + currentVideoNode + i + "].enabled, false););";
            actionShowArray.push(hotspotShowCall);
            actionHideArray.push(hotspotHideCall);
            actionTimeIds.push(hotspotCallWhenId1);
            actionTimeIds.push(hotspotCallWhenId2);
        }
        else if(jsonList.videos[currentVideoNode].actions[i].actionType == 1){
            var hotspotCreationCall = 'createHotspot(' + currentVideoNode + i + ', ' + getActionAth(i) + ', ' + getActionAtv(i) + ', ' + 
            jsonList.videos[currentVideoNode].actions[i].nextNode + ', ' + getActionNodeImage(i) + ', "' + 
            getNodeStyle(jsonList.videos[currentVideoNode].actions[i].nextNode) + '", "'+ jsonList.videos[currentVideoNode].actions[i].actionText +'");';
            krpano.call(hotspotCreationCall);
            
            var hotspotCallWhenId1 = "hsshow" + currentVideoNode + i;
            var hotspotCallWhenId2 = "hshide" + currentVideoNode + i;
            var hotspotShowCall = "callwhen(" + hotspotCallWhenId1 + ", plugin[video].timepercent GE " + jsonList.videos[currentVideoNode].actions[i].startTime + ", set(hotspot[hotspot" + currentVideoNode + i + "].visible, true); set(hotspot[hotspot" + currentVideoNode + i + "].enabled, true););";
            var hotspotHideCall = "callwhen(" + hotspotCallWhenId2 + ", plugin[video].timepercent GE " + jsonList.videos[currentVideoNode].actions[i].endTime + ", set(hotspot[hotspot" + currentVideoNode + i + "].visible, false); set(hotspot[hotspot" + currentVideoNode + i + "].enabled, false););";
            actionShowArray.push(hotspotShowCall);
            actionHideArray.push(hotspotHideCall);
            actionTimeIds.push(hotspotCallWhenId1);
            actionTimeIds.push(hotspotCallWhenId2);
        }
    }

    callActionVisibilityCalls();
};

function getNodeStyle(id){
    var nodeStyle = "hs_tool_default";

    for (let i = 0; i < jsonList.videos.length; i++){
        if (jsonList.videos[i].nodeId == id){
            nodeStyle = "hs_tool_move";
        }
    }
    for (let j = 0; j < jsonList.tools.length; j++){
        if (jsonList.tools[j].nodeId == id){
            if(jsonList.tools[j].toolTypeInt == 1){
                nodeStyle = "hs_tool_question";
            }
            else if(jsonList.tools[j].toolTypeInt == 2){
                nodeStyle = "hs_tool_info";
            }
        }
    }

    return nodeStyle;
};

function getScreenButtonStyle(id){
    var screenButtonStyle = "sb_default";

    for (let i = 0; i < jsonList.videos.length; i++){
        if (jsonList.videos[i].nodeId == id){
            screenButtonStyle = "sb_move";
        }
    }
    for (let j = 0; j < jsonList.tools.length; j++){
        if (jsonList.tools[j].nodeId == id){
            if(jsonList.tools[j].toolTypeInt == 1){
                screenButtonStyle = "sb_question";
            }
            else if(jsonList.tools[j].toolTypeInt == 2){
                screenButtonStyle = "sb_info";
            }
        }
    }

    return screenButtonStyle;
};

function callActionVisibilityCalls(){
    if(actionShowArray.length > 0){
        actionShowArray.forEach(string => krpanoCall(string));
    }

    if(actionHideArray.length > 0){
        actionHideArray.forEach(string => krpanoCall(string));
    }
};

function hideScreenButtons(){
    if(screenButtonCount > 0){
        for(let i = 0; i < screenButtons.length; i++){
            krpanoCall('set(layer['+screenButtons[i]+'].alpha, 0);');
        }
    }
};

function showScreenButtons(){
    if(screenButtonCount > 0){
        for(let i = 0; i < screenButtons.length; i++){
            krpanoCall('set(layer['+screenButtons[i]+'].alpha, 1);');
        }
    }
};

//Cancel delayed calls that were created in previous scene
function cancelActionVisibilityCalls(){
    if(actionTimeIds.length > 0){
        actionTimeIds.forEach(string => krpanoCall("stopcallwhen(" + string + ")"));
    }
};

function krpanoCall(call){
    krpano.call(call);
};

function resetTimerArray(){
    if(timerArray.length > 0){
        //timerArray.forEach(stopDelayedCall);
        timerArray.length = 0;
    }
};

function stopDelayedCall(id){
    var cancelCall = "stopdelayedcall(" + id + ");";
    krpano.call(cancelCall);
};

function getActionNodeImage(id){
    let imageUrl = "sprites/icon_default.png";
    if(jsonList.videos[currentVideoNode].actions[id].iconName == "moving"){
        imageUrl = "sprites/icon_walk.png";
    }
    else if(jsonList.videos[currentVideoNode].actions[id].iconName == "touch"){
        imageUrl = "sprites/icon_hand.png";
    }
    else if(jsonList.videos[currentVideoNode].actions[id].iconName == "speak"){
        imageUrl = "sprites/icon_speak.png";
    }
    return imageUrl;
};

function getActionAth(id){
    var ath;

    if(jsonList.videos[currentVideoNode].actions[id].worldPosition.x < 0 && jsonList.videos[currentVideoNode].actions[id].worldPosition.z >= 0){
        ath = -(180 + (180/Math.PI) * Math.atan(jsonList.videos[currentVideoNode].actions[id].worldPosition.z / jsonList.videos[currentVideoNode].actions[id].worldPosition.x));
    }
    else if(jsonList.videos[currentVideoNode].actions[id].worldPosition.x >= 0 && jsonList.videos[currentVideoNode].actions[id].worldPosition.z >= 0){
        ath = -(180/Math.PI) * Math.atan(jsonList.videos[currentVideoNode].actions[id].worldPosition.z / jsonList.videos[currentVideoNode].actions[id].worldPosition.x);
    }
    else if(jsonList.videos[currentVideoNode].actions[id].worldPosition.x < 0 && jsonList.videos[currentVideoNode].actions[id].worldPosition.z < 0){
        ath = 180 - (180/Math.PI) * Math.atan(jsonList.videos[currentVideoNode].actions[id].worldPosition.z / jsonList.videos[currentVideoNode].actions[id].worldPosition.x);
    }
    else if(jsonList.videos[currentVideoNode].actions[id].worldPosition.x >= 0 && jsonList.videos[currentVideoNode].actions[id].worldPosition.z < 0){
        ath = -(180/Math.PI) * Math.atan(jsonList.videos[currentVideoNode].actions[id].worldPosition.z / jsonList.videos[currentVideoNode].actions[id].worldPosition.x);
    }

    return ath;
};

function getActionAtv(id){

    var atv;

    atv = (180/Math.PI) * Math.atan(jsonList.videos[currentVideoNode].actions[id].worldPosition.y / Math.sqrt(Math.pow(jsonList.videos[currentVideoNode].actions[id].worldPosition.z, 2) + Math.pow(jsonList.videos[currentVideoNode].actions[id].worldPosition.x, 2)))

    return -atv;
};

function getPointAth(id, point){
    var ath;

    if(jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].x < 0 && jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].z >= 0){
        ath = -(180 + (180/Math.PI) * Math.atan(jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].z / jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].x));
    }
    else if(jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].x >= 0 && jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].z >= 0){
        ath = -(180/Math.PI) * Math.atan(jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].z / jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].x);
    }
    else if(jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].x < 0 && jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].z < 0){
        ath = 180 - (180/Math.PI) * Math.atan(jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].z / jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].x);
    }
    else if(jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].x >= 0 && jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].z < 0){
        ath = -(180/Math.PI) * Math.atan(jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].z / jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].x);
    }

    return ath;
};

function getPointAtv(id, point){

    var atv;

    atv = (180/Math.PI) * Math.atan(jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].y / Math.sqrt(Math.pow(jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].z, 2) + Math.pow(jsonList.videos[currentVideoNode].actions[id].areaMarkerVertices2[point].x, 2)))

    return -atv;
};

function popUpClosed(){
    popUpOpen = false;
};

function hideHoverTexts(){
    krpanoCall("set(layer[mouse_hover_text_info].alpha, 0);");
    krpanoCall("set(layer[mouse_hover_text_question].alpha, 0);");
    krpanoCall("set(layer[mouse_hover_text_move].alpha, 0);");
    krpanoCall("set(layer[mouse_hover_text_default].alpha, 0);");
}

function openQuestionSheet(){
    popUpOpen = true;

    hideHoverTexts();

    if(jsonList.tools[currentToolNode].toolTypeInt == 0){
        var randomNode = jsonList.tools[currentToolNode].nextNodes[Math.floor(Math.random() * jsonList.tools[currentToolNode].nextNodes.length)];

        getNodeData(randomNode);

        return;
    }

    pauseTimer();

    answerArray.length = 0;

    krpano.call("plugin[video].pause();");
    
    //var popUpContent = getHtmlContent();
    var popUpContent = "empty";

    var closeButtonBool = false;

    if(jsonList.tools[currentToolNode].toolTypeInt == 2){
        closeButtonBool = true;
    }

    //krpano.call("popup('html', " + popUpContent + ", get(windowsizes.size[popup].width), get(windowsizes.size[popup].height), true);");
    krpano.call("popup('html', " + popUpContent + ", " + closeButtonBool + ");");

    krpanoCall();
}

function getHtmlContent(){
    //krpano.call("set(control.usercontrol, off);");

    var htmlContent = "";

    if(jsonList.tools[currentToolNode].toolTypeInt == 2){
        document.getElementById('popup-background').classList.add("info-window");
        if(jsonList.tools[currentToolNode].spritePath != ""){
            htmlContent += '<img src="tours/' + currentFolderName +'/' + jsonList.tools[currentToolNode].spritePath + '" alt="' + jsonList.tools[currentToolNode].infoText + '" class="info-window-material">';
        }
        if(jsonList.tools[currentToolNode].video2Dpath != ""){
            htmlContent += '<video class="info-window-material" controls>';
            htmlContent += '<source src="tours/' + currentFolderName + '/' + jsonList.tools[currentToolNode].video2Dpath + '" type="video/mp4">';
            htmlContent += '</video>';
        }
        if(jsonList.tools[currentToolNode].infoText != ""){
            htmlContent += "<p>" + jsonList.tools[currentToolNode].infoText + "</p>";
        }
    }
    else if(jsonList.tools[currentToolNode].toolTypeInt == 1){
        document.getElementById('popup-background').classList.add("question-window");
        //htmlContent = "<h1>" + jsonList.tools[currentToolNode].question.questionTitleText + "</h1>";
        htmlContent += "<p>" + jsonList.tools[currentToolNode].question.questionText + "</p><br>";

        if(jsonList.tools[currentToolNode].spritePath != ""){
            htmlContent += '<img src="tours/' + currentFolderName +'/' + jsonList.tools[currentToolNode].spritePath + '" alt="' + jsonList.tools[currentToolNode].infoText + '" class="info-window-material"><br>';
        }
        if(jsonList.tools[currentToolNode].video2Dpath != ""){
            htmlContent += '<video class="info-window-material" controls>';
            htmlContent += '<source src="tours/' + currentFolderName + '/' + jsonList.tools[currentToolNode].video2Dpath + '" type="video/mp4">';
            htmlContent += '</video>';
        }
        if(jsonList.tools[currentToolNode].infoText != ""){
            htmlContent += "<p>" + jsonList.tools[currentToolNode].infoText + "</p>";
        }

        if(jsonList.tools[currentToolNode].question.answers.length > 0){
            if(jsonList.tools[currentToolNode].question.multichoice == false){
                for(let i=0; i < jsonList.tools[currentToolNode].question.answers.length; i++){
                    htmlContent += '<button type="button" class="button" onclick="nodeAfterAnswer(' + jsonList.tools[currentToolNode].question.correctAnswers[i] + ')">' + jsonList.tools[currentToolNode].question.answers[i] + '</button><br>';
                }
            }
            else{
                for(let i=0; i < jsonList.tools[currentToolNode].question.answers.length; i++){
                    htmlContent += 
                    '<label class="container">' +
                        '<input type="checkbox" id="box'+ i +'" onclick="enableSubmitButton();">' +
                        '<span class="checkmark"></span>' + jsonList.tools[currentToolNode].question.answers[i] +
                    '</label><br>';
                }

                htmlContent += '<br><button id="submitButton" type="button" class="button" onclick="checkAnswers()" disabled>Submit</button>';
            }
        }
    }
    else{
        document.getElementById('popup-background').classList.add("default-window");
        htmlContent = "<b>ERROR: Defective tool node data</b>";
    }

    return htmlContent;
}

function getInfoContent(){
    let infoContent = "";

    if(jsonList.tools[currentToolNode].toolTypeInt == 2){
        document.getElementById('popup-title').classList.add("info-title");
        infoContent = "<h1>Info</h1>";
    }
    else if(jsonList.tools[currentToolNode].toolTypeInt == 1){
        document.getElementById('popup-title').classList.add("question-title");
        infoContent = "<h1>" + jsonList.tools[currentToolNode].question.questionTitleText + "</h1>";
    }
    else{
        document.getElementById('popup-title').classList.add("default-title");
        infoContent = "<h1><b>ERROR</b></h1>";
    }

    return infoContent;
}

function enableSubmitButton(){
    document.getElementById("submitButton").disabled = false;
}

function changeAnswer(elem, value){
    answerArray[elem] = parseInt(value);
};

function submitAnswers(){
    var nextNode = 0;
    for(let i = 0; i < jsonList.tools[currentToolNode].question.correctAnswers.length; i++){
        if(!answerArray[i] == jsonList.tools[currentToolNode].question.correctAnswers[i]){
            nextNode = 1;
        }
        if(answerArray[i] == 0){
            score += jsonList.tools[currentToolNode].question.answerScores[i];
        }
        maxScore += jsonList.tools[currentToolNode].question.answerScores[i];
    }

    getNodeData(jsonList.tools[currentToolNode].nextNodes[nextNode]);
};

function checkAnswers(){
    var nextNode = 0;
    for(let i = 0; i < jsonList.tools[currentToolNode].question.correctAnswers.length; i++){
        var boxToCheck = "box" + i;
        if(document.getElementById(boxToCheck).checked){
            if(!jsonList.tools[currentToolNode].question.correctAnswers[i] == 0){
                nextNode = 1;
            }
            score += jsonList.tools[currentToolNode].question.answerScores[i];

        } else{
            if(!jsonList.tools[currentToolNode].question.correctAnswers[i] == 1){
                nextNode = 1;
            }
        }
        maxScore += jsonList.tools[currentToolNode].question.answerScores[i];
    }

    getNodeData(jsonList.tools[currentToolNode].nextNodes[nextNode]);

}

function nodeAfterAnswer(id){
    var nodeAfterId = jsonList.tools[currentToolNode].nextNodes[id];
    getNodeData(nodeAfterId);
};

function endSimulation(){
    var scoreText = "Total score: " + score + " / " + maxScore;
    krpano.call("endSimulation(" + scoreText + ");");
    resetTimer();
    resetTimerArray();
    pauseTimer();
    screenButtonCount = 0;
};

//------------------------------------------------------------------------------------------------------
//Timer

function createNewTimer(time, call){
    const t = {};
    t.time = time;
    t.call = call;
    t.called = 0;
    timerArray.push(t);
};

var seconds = 00;
var tens = 00;
var stringseconds = "00";
var stringtens = "00";
let Interval;

function startTimer(){
    clearInterval(Interval);
    Interval = setInterval(runTimer, 10);
};

function pauseTimer(){
    clearInterval(Interval)
};

function resetTimer(){
    clearInterval(Interval);
    tens = 00;
  	seconds = 00;
};

function runTimer () {
    tens++; 
    
    if(tens <= 9){
      stringtens = "0" + tens;
    }
    
    if (tens > 9){
      stringtens = tens;
      
    } 
    
    if (tens > 99) {
      seconds++;
      timerArray.forEach(element => checkTimerCall(element));
      stringseconds = "0" + seconds;
      tens = 0;
      stringtens = "0" + 0;
    }
    
    if (seconds > 9){
      stringseconds = seconds;
    }

    var krpanotime = stringseconds + ":" + stringtens;
    krpano.call("set(layer[layer_scene_time].html, '" + krpanotime + "');");
  
};

function checkTimerCall(t){
    if(t.time <= seconds && t.called == 0){
        krpano.call(t.call);
        t.called = 1;
    }
}
