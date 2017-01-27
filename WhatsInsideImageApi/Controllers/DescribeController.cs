using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WhatsInsideImageApi.Controllers
{
    [Route("api/describe")]
    public class DescribeController : Controller
    {
        private readonly IHostingEnvironment _hostingEnvironment;

        public DescribeController(IHostingEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        // GET api/describe
        [HttpGet]
        public IEnumerable<string> Get()
        {
            var webRootPath = _hostingEnvironment.ContentRootPath;
            return new[] { webRootPath, DateTime.Now.ToString(CultureInfo.InvariantCulture) };
        }

        // POST api/describe + file attachment :)
        [HttpPost]
        public ActionResult DescribeIt()
        {

            var webRootPath = _hostingEnvironment.ContentRootPath;
            var file = Request.Form.Files.First();
            var targetFile = Path.Combine(webRootPath, file.FileName);
            WriteFile(file, targetFile);

            var command = "sh";
            var myBatchFile = $"{webRootPath}/predictor.sh";
            var args = $"{myBatchFile} {targetFile}";

            var processInfo = new ProcessStartInfo
            {
                UseShellExecute = false,
                FileName = command,
                Arguments = args,
                RedirectStandardOutput = true
            };

            var process = Process.Start(processInfo);
            process.WaitForExit();
            var output = process.StandardOutput.ReadToEnd();

            /*
             Successful prediction would be : 

              Captions for image filename.jpg:
              0) a group of people sitting around a table . (p=0.010212)
              1) a group of people sitting around a table with food . (p=0.001988)
              2) a group of people sitting around a table with a cake . (p=0.000799)

            */

            if (output.Contains("Captions for image"))
            {
                output = output.Substring(output.IndexOf("Captions for image"));
                var lines = output
                    .Split(Environment.NewLine[0])
                    .Skip(1)
                    .Select(a => a.Trim())
                    .Where(a => a.Length > 3 && a.Contains("(p="))
                    .Select(a => a.Substring(3))
                    .Select(a => a.Substring(0, a.IndexOf("(p=", StringComparison.OrdinalIgnoreCase)).Trim())
                    .ToArray();
                return Ok(lines);
            }
            return BadRequest("Cannot predict image description" + Environment.NewLine +  output);
        }

        private void WriteFile(IFormFile file, string targetFileName)
        {
            using (var newFile = System.IO.File.Create(targetFileName))
            {
                file.CopyTo(newFile);
                newFile.Flush();
            }
        }
    }
}
