import RecordRTC from "recordrtc";

function init(Survey) {
  var widget = {
	
    name: "camera",
    title: "Camera",
    iconName: "icon-camera",
    widgetIsLoaded: function() {
      return typeof RecordRTC != "undefined";
    },
    isFit: function(question) {
      return question.getType() === "camera";
    },
    htmlTemplate:
		"<div>"+
		"<button type='button'  title='Record'>НАЧАТЬ ОТВЕТ</button>"+ 
		"&nbsp;<button type='button' title='Save'>ЗАКОНЧИТЬ ОТВЕТ</button>"+
		"&nbsp;<video style='"+
		"position:relative; "+
		"top:16px; "+
		"left:10px; "+
		"height:480px;"+
		"width:640px;"+
		"-moz-box-shadow: 2px 2px 4px 0px #006773;"+
		"-webkit-box-shadow:  2px 2px 4px 0px #006773;"+
		"box-shadow: 2px 2px 4px 0px #006773;"+
		"' "+
		"controls='true' >"+
		"</video>"+
		"</div>",
    activatedByChanged: function(activatedBy) {
      Survey.JsonObject.metaData.addClass("camera", [], null, "empty");
	  Survey.JsonObject.metaData.addProperties("camera", [
        {
          name: "maxRecordTime:number",
          default: 0
        }
      ]);
    }
	,
    afterRender: function(question, el) {
      var rootWidget = this;
	  var buttonStartEl = el.getElementsByTagName("button")[0];
	  var buttonStopEl = el.getElementsByTagName("button")[1];
	  var videoEl = el.getElementsByTagName("video")[0];
	 
	 
//////////  RecordRTC logic	
	  
	  var successCallback = function(stream) {
		var options={
			type: 'video',
			disableLogs: true, 
			numberOfAudioChannels: 1
		};  
		console.log("successCallback");
		question.survey.mystream = stream;
		question.survey.recordRTC = RecordRTC(question.survey.mystream, options);
		if(typeof question.survey.recordRTC != "undefined"){
			console.log("startRecording");
			question.survey.recordRTC.startRecording();
			if(question.maxRecordTime >0){
				console.log("start timer for " + question.maxRecordTime + " second");
				question.timeoutid=setTimeout(stopRecording, 1000 * question.maxRecordTime);
			}else{
				question.timeoutid=0;
			}
		}
	  };

	  var errorCallback=function() {
		alert('No camera');
		question.survey.recordRTC=undefined;
		question.survey.mystream=undefined;
	  };

	  var processVideo= function(VideoVideoWebMURL) {
		console.log("processVideo");
		if(typeof question.survey.recordRTC != "undefined"){
			var recordedBlob = question.survey.recordRTC.getBlob();
			
			var fileReader = new FileReader();
			fileReader.onload = function(event){
			  var dataUri = event.target.result;
			  question.value = dataUri;
			  console.log("getBlob.dataUri: " +question.value.substring(0,255));
			  //videoEl.src=dataUri;
			  
			  console.log("cleaning");
			  question.survey.recordRTC=undefined;
			  
			  if(typeof question.survey.mystream != "undefined"){
				question.survey.mystream.getVideoTracks().forEach(function(track) {
				track.stop();
				}
				);
			}
			  question.survey.mystream=undefined;
			};
			fileReader.readAsDataURL(recordedBlob);
		}else{
			console.log("Error. RecordRTC is undefined at process Video!");
		}
	  };

      var startRecording=function() {
		    
		  buttonStartEl.style.opacity = 0.2;
		  buttonStopEl.style.opacity = 1;
		  
		 // erase previous data 
		 question.value=undefined;
		
       	// if recorder open on another question	- try to stop recording		
		if(typeof question.survey.recordRTC != "undefined"){
			question.survey.recordRTC.stopRecording(doNothingHandler);
			if(typeof question.survey.mystream != "undefined"){
				question.survey.mystream.getVideoTracks().forEach(function(track) {
				track.stop();
				}
				);
			}
		}
			 
		var mediaConstraints = {
		  video: true,
		  audio: true
		};
		
		navigator.mediaDevices
			.getUserMedia(mediaConstraints)
			.then(successCallback.bind(this), errorCallback.bind(this));
     };

	  var stopRecording=function() {
		  
		  buttonStartEl.style.opacity = 1;
		  buttonStopEl.style.opacity = 0.2;
		  if(question.timeoutid!=0){
			  console.log("ClearTimeOut of max record time");
			  clearTimeout(question.timeoutid);
			  question.timeoutid=0;
		  }
		  console.log("stopRecording");
		  if(typeof question.survey.recordRTC != "undefined"){
			question.survey.recordRTC.stopRecording(processVideo.bind(this));
			if(typeof question.survey.mystream != "undefined"){
				question.survey.mystream.getVideoTracks().forEach(function(track) {
					track.stop();
				}
				);
			}
		  }
	  };
	
//////////////  end RTC logic //////////////////
	  
	  if (!question.isReadOnly) {
        buttonStartEl.onclick = startRecording;
		
      } else {
        buttonStartEl.parentNode.removeChild(buttonStartEl);
      }
	  
	  if (!question.isReadOnly) {
        buttonStopEl.onclick = stopRecording;
		buttonStopEl.style.opacity = 0.2;
      } else {
        buttonStopEl.parentNode.removeChild(buttonStopEl);
      }
	  
	   if (question.isReadOnly) {
		  videoEl.src=question.value
	   }else{
		  videoEl.parentNode.removeChild(videoEl);
	   }
      
      var updateValueHandler = function() {
        
      };
	  
	  var doNothingHandler = function() {
        
      };
	  
      question.valueChangedCallback = updateValueHandler;
      updateValueHandler();
	  
     
    },
    willUnmount: function(question, el) {
      console.log("unmount camera no record ");
      if(typeof question.survey.recordRTC != "undefined"){
			question.survey.recordRTC.stopRecording(doNothingHandler);
			if(typeof question.survey.mystream != "undefined"){
				question.survey.mystream.getVideoTracks().forEach(function(track) {
				track.stop();
				});
			}
		question.value=undefined;
		question.survey.recordRTC=undefined;
		question.survey.mystream=undefined;
	   }
    }
  };

  Survey.CustomWidgetCollection.Instance.addCustomWidget(widget, "customtype");
}

if (typeof Survey !== "undefined") {
  init(Survey);
}

export default init;
