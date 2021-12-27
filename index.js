const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const validator = require('./validator');

const app = express();

app.use(express.static('dist'));

// enable files upload
app.use(
  fileUpload({
    createParentPath: true,
  })
);

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

//start app
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`App is listening on port ${port}.`));

app.get('/', function (req, res) {
  res.sendFile('dist/index.html');
});

// app.get("/", async (req, res) => {
//   res.send(
//     '<html lang="en">\n' +
//       "  <body>\n" +
//       "  <h4>Light Show Validator Based on github.com/teslamotors/light-show</h4>" +
//       "    <form \n" +
//       "      id='uploadForm' \n" +
//       "      action='/validate' \n" +
//       "      method='post' \n" +
//       '      encType="multipart/form-data">\n' +
//       '        <input type="file" name="fseq" /><br><br>\n' +
//       '        <input type="checkbox" name="json" id="json" value="json" />\n' +
//       '        <label for="json">JSON Response</label>\n' +
//       "        <br><br><input type='submit' value='Validate' />\n" +
//       "    </form>     \n" +
//       "  </body>\n" +
//       "</html>"
//   );
// });

app.post('/validate', async (req, res) => {
  try {
    if (!req.files) {
      res.send({
        status: false,
        message: 'No file uploaded',
      });
    } else {
      //Use the name of the input field (i.e. "fseq") to retrieve the uploaded file
      let fseq = req.files.fseq;
      let d = new Uint8Array(fseq.data);
      let validation = validator(d);

      //send response
      if (req.body.json) {
        let jsonRes;
        if (validation.error) {
          jsonRes = {
            valid: false,
            file: {
              name: fseq.name,
              size: fseq.size,
              md5: fseq.md5,
            },
            error: validation.error,
          };
        } else {
          jsonRes = {
            valid: true,
            file: {
              name: fseq.name,
              size: fseq.size,
              md5: fseq.md5,
            },
            validation,
          };
        }

        res.send(jsonRes);
      } else {
        let resData;
        if (validation.error) {
          resData = 'VALIDATION ERROR: ' + validation.error;
        } else {
          const durationFormatted = new Date(validation.durationSecs * 1000)
            .toISOString()
            .substr(11, 12);
          const memoryUsage = parseFloat(
            (validation.memoryUsage * 100).toFixed(2)
          );
          resData =
            `Found ${validation.frameCount} frames, step time of ${validation.stepTime} ms for a total duration of ${durationFormatted}.<br>\n` +
            `Used ${memoryUsage}% of the available memory`;
        }

        let html =
          '<html lang="en">\n' +
          '  <body>\n' +
          `${resData}` +
          '  </body>\n' +
          '</html>';
        res.send(html);
      }
    }
  } catch (err) {
    console.log('Error during validation', err);
    res.status(500).send(err);
  }
});