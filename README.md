Audio Input Analyser
======

se the Audio Input Analyser to receive real-time audio analysis of your computer microphone's audio stream. The script uses both the getUserMedia and Web Audio APIs and is compatible in the latest version of Chrome.

You can find example implentations in the 'public' folder.

To get started, reference the AudioInputAnalyzer.min.js file in a &lt;script&gt; in the &lt;head&gt; of your document. Create and initialize a new AudioController. The AudioController uses pubsub to broadcast when data is ready. Subscribe to the 'meter' event and pass a callback to handle the data. 


```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv='content-type' content='text/html; charset=UTF-8' />
  <title>Audio Input Analyser</title>
  <script src='scripts/AudioInputAnalyzer.min.js' type='text/javascript' charset='utf-8'></script>
  </head>
  <body>
    <script type='text/javascript' charset='utf-8'>

      var audioController = new AudioInputAnalyzer.AudioController();
      audioController.init();

      AudioInputAnalyzer.PubSub.subscribe('meter', function(data) {
        // work with data here
        document.body.innerHTML = 'channel1 avg volume: ' + data.averageVol1.toFixed() + '<br /> channel2 avg volume: ' + data.averageVol2.toFixed();
      });

    </script>
  </body>
</html>

```
======

A pre-commit hook is defined in /pre-commit that runs jshint. To use the hook, run the following:

ln -s ../../pre-commit .git/hooks/pre-commit

A post-commit hook is defined in /post-commit that runs the Plato complexity analysis tools. To use the hook, run the following:

ln -s ../../post-commit .git/hooks/post-commit

To install Plato, run the following.

npm install -g plato