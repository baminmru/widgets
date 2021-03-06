import RecordRTC from "recordrtc";

function init(Survey) {
  var widget = {
	
    name: "microphone",
    title: "Microphone",
    iconName: "icon-microphone",
    widgetIsLoaded: function() {
      return typeof RecordRTC != "undefined";
    },
    isFit: function(question) {
      return question.getType() === "microphone";
    },
    htmlTemplate:
		"<div>"+
		"<button type='button'  title='Record'>НАЧАТЬ ОТВЕТ</button>"+ 
		"&nbsp;<button type='button' title='Save'>ЗАКОНЧИТЬ ОТВЕТ</button>"+
		"&nbsp;<audio style='"+
		"position:relative; "+
		"top:16px; "+
		"left:10px; "+
		"height:35px;"+
		"-moz-box-shadow: 2px 2px 4px 0px #006773;"+
		"-webkit-box-shadow:  2px 2px 4px 0px #006773;"+
		"box-shadow: 2px 2px 4px 0px #006773;"+
		"' "+
		"controls='true' >"+
		"</audio>"+
		"</div>",
    activatedByChanged: function(activatedBy) {
      Survey.JsonObject.metaData.addClass("microphone", [], null, "empty");
	  Survey.JsonObject.metaData.addProperties("microphone", [
        {
          name: "maxRecordTime:number",
          default: 0
        }
      ]);
    },
	
    afterRender: function(question, el) {
      var rootWidget = this;
	  var buttonStartEl = el.getElementsByTagName("button")[0];
	  var buttonStopEl = el.getElementsByTagName("button")[1];
	  var audioEl = el.getElementsByTagName("audio")[0];

//////////  RecordRTC logic	
	  
	  var successCallback = function(stream) {
		var options={
			type: 'audio',
			recorderType: RecordRTC.StereoAudioRecorder,
			mimeType: 'audio/wav',
			//audioBitsPerSecond: 16000 * 16 ,
			sampleRate: 44100 , 
			bufferSize: 8192, 
			//leftChannel :true,
			numberOfAudioChannels: 2
		};  
		console.log("successCallback");
		question.survey.mystream = stream;
		question.survey.recordRTC = RecordRTC(question.survey.mystream, options);
		if(typeof question.survey.recordRTC != "undefined"){
			console.log("startRecording");
			if(question.maxRecordTime >0){
				console.log("start timer for " + question.maxRecordTime + " second");
				question.timeoutid=setTimeout(stopRecording, 1000 * question.maxRecordTime);
			}else{
				question.timeoutid=0;
			}
			question.survey.recordRTC.startRecording();
		}
	  };

	  var errorCallback=function() {
		alert('No microphone');
		question.survey.recordRTC=undefined;
		question.survey.mystream=undefined;
	  };

	  var processAudio= function(audioVideoWebMURL) {
		console.log("processAudio");
		
		if(typeof question.survey.recordRTC != "undefined"){
			var recordedBlob = question.survey.recordRTC.getBlob();
			
			var fileReader = new FileReader();
			fileReader.onload = function(event){
				var dataUri = event.target.result;
				question.value = dataUri;
				console.log("getBlob.dataUri: " +question.value.substring(0,255));
			 
				console.log("cleaning");
				question.survey.recordRTC=undefined;
				if(typeof question.survey.mystream != "undefined"){
						question.survey.mystream.getAudioTracks().forEach(function(track) {
						track.stop();
						}
						);
					}
				question.survey.mystream=undefined;
			};
		}else{
			console.log("Error. RecordRTC is undefined at process Audio!");
		}
        fileReader.readAsDataURL(recordedBlob);
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
				question.survey.mystream.getAudioTracks().forEach(function(track) {
				track.stop();
				}
				);
			}
		}
			 
		var mediaConstraints = {
		  video: false,
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
			question.survey.recordRTC.stopRecording(processAudio.bind(this));
			if(typeof question.survey.mystream != "undefined"){
				question.survey.mystream.getAudioTracks().forEach(function(track) {
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
		  audioEl.src=question.value
	   }else{
		  audioEl.parentNode.removeChild(audioEl);
	   }
	   
      var updateValueHandler = function() {
        
      };
	  
	  var doNothingHandler = function() {
        
      };
	  
      question.valueChangedCallback = updateValueHandler;
      updateValueHandler();
	  
     
    },
    willUnmount: function(question, el) {
      console.log("unmount microphone no record ");
      if(typeof question.survey.recordRTC != "undefined"){
			question.survey.recordRTC.stopRecording(doNothingHandler);
			if(typeof question.survey.mystream != "undefined"){
				question.survey.mystream.getAudioTracks().forEach(function(track) {
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
