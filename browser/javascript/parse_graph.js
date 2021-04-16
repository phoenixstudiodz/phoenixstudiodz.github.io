/*
(c) 2020 Alamgir Research Inc. All rights reserved. Proprietary code.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL ALAMGIR RESEARCH INC NOR IT'S OFFICERS NOR IT'S EMPLOYEES NOR IT'S CONTRACTORS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. FURTHERMORE THE SOFTWARE
IS PROVIDED ONLY FOR NON-COMMERCIAL USE. COMMERCIAL USE IS NOT PERMITTED WITHOUT EXPLICIT WRITTEN PERMISSION OF
ALAMGIR RESEARCH INC. USE OF THE SOFTWARE OUTSIDE OF THE CONTEXT OF THIS WEBSITE IS PROHIBITED.
 */

/*
Parse TGF file 
input: string - TGF file 
output: Nodes: nodes found in the file
        Edges: edges found in the file

 */
function parseTGF(tgfData) {
   var lines = tgfData.split('\n');
   // remove white space
   lines = lines.map(el => el.trim());
   lines = lines.filter(el => el && el.length > 0);
   var nodes = [];
   var edgesStart = 0;
   // find nodes
   for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#')) {
         edgesStart = i;
         break;
      }
      var data = lines[i].split(" ");
      data = data.map(el => el.trim());
      data = data.filter(el => el);
      data = data.filter(el => el && el.length > 0);
      if (!isNaN(data[0])) nodes.push(data[0]);
   }
   var edges = [];
   // find edges
   for (i = edgesStart + 1; i < lines.length; i++) {
      var data = lines[i].split(" ");
      data = data.map(el => el.trim());
      data = data.filter(el => el && el.length > 0);
      if (!isNaN(data[0]) && !isNaN(data[1])) {
         edges.push([data[0], data[1]]);
      }
   }
   return { nodes, edges };
}

/*
Parse GV file 
input: string - TGV file 
output: Nodes: nodes found in the file
        Edges: edges found in the file

 */

function parseGV(gvData) {
   // replaceAll isn't supported by all browser
   if ("".replaceAll) {
      gvData = gvData.replaceAll(/\*(.|\n)*?\*/g, '');
   }
   else {
      gvData = gvData.replace(/\*(.|\n)*?\*/g, '');
   }
   var lines = gvData.split('\n');
   // remove white space
   lines = lines.map(el => el.trim());
   // remove comments
   lines = lines.filter(el => !el.startsWith('#') && !el.startsWith('//'));
   lines = lines.filter(el => !el.includes('{') && !el.includes('}'));
   
   var edges = [];
   var styleNodes = {};
   // extract nodes
   for (var i = 0; i < lines.length; i++) {
      // extract styling
      var style = {};
      if (lines[i].includes('[') && lines[i].includes(']')) {
         var items = lines[i].match(/\[.*?\]/);
         if ("".replaceAll) {
            items = items.map(el => el.replaceAll(/\[|\]|\"/g, ''));
         }
         else {
            items = items.map(el => el.replace(/\[|\]|\"/g, ''));
         }
         items.forEach(el => {
            var params = el.split('=');
            if (params[0].toLowerCase() == 'color') style = { ...style, color: params[1] };
            if (params[0].toLowerCase() == 'label') style = { ...style, label: params[1] };
         });
         // if it is a node , create node  and delete style, else leave it
         if (!lines[i].includes('--') && !lines[i].includes('->')) {
            var data = lines[i].split(' ');
            data = data.map(el => el.trim());
            data = data.filter(el => el && el.length > 0);
            if (style.label) styleNodes[data[0]] = style.label;
            style = {};
         }
      }
      // find edges
      var data = lines[i].split(' ');
      // remove white space
      data = data.map(el => el.trim());
      data = data.filter(el => el && el.length > 0);
      for (j = 0; j < data.length; j++) {
         // edge underected
         if (data[j] === '--') {
            if (data[j - 1] && data[j + 1]) {
               if (data[j + 1].endsWith(';')) {
                  data[j + 1] = data[j + 1].substr(0, data[j + 1].length - 1);
               }
               //edges.push([data[j-1],data[j+1],{color: 'red', label: 'Foo bar'}]);
               if (style.color || style.label) {
                  edges.push([data[j - 1], data[j + 1], { ...style, directional: false }]);
               }
               else {
                  edges.push([data[j - 1], data[j + 1], { directional: false }]);
               }
            }
         }
         // edge derected
         if (data[j] === '->') {
            if (data[j - 1] && data[j + 1]) {
               if (data[j + 1].endsWith(';')) {
                  data[j + 1] = data[j + 1].substr(0, data[j + 1].length - 1);
               }
               if (style.color || style.label) edges.push([data[j - 1], data[j + 1], style]);
               else edges.push([data[j - 1], data[j + 1]]);
            }
         }

      }
   }
   //replacing the label isn't safe
   if (styleNodes) {
      edges.map(el => {
         if (styleNodes[el[0]]) el[0] = styleNodes[el[0]];
         if (styleNodes[el[1]]) el[1] = styleNodes[el[1]];
         return el;
      })
   }

   var nodes = [];
   // add styling
   edges.forEach(el => {
      var _nodes = el.filter(n => typeof n === 'string' || n instanceof String);
      _nodes.map(el => { return { label: el, color: el.color } })
      if (_nodes) nodes.push(..._nodes);
   })
   nodes = [...new Set([...nodes])];
   return { nodes, edges };
}

/*
Parse GML file 
input: string - GML file 
output: Nodes: nodes found in the file
        Edges: edges found in the file

 */

function parseGML(gmlData) {
   // create parser
   var parser = new DOMParser();
   var xmlDoc = parser.parseFromString(gmlData, "text/xml");
   var type = xmlDoc.getElementsByTagName("graph");
   var directional = true;
   // check if graph is directional by defaut
   if (type && type[0] && type[0].getAttribute("edgedefault")) {
      directional = !(type[0].getAttribute("edgedefault") == 'undirected');
   }
   // extract nodes
   var nodeEntries = xmlDoc.getElementsByTagName("node");
   var nodes = []
   for (var i = 0; i < nodeEntries.length; i++) {
      nodes.push(nodeEntries[i].getAttribute('id'))
   }
   // extract edges
   var edgesEntries = xmlDoc.getElementsByTagName("edge");
   var edges = []
   for (var i = 0; i < edgesEntries.length; i++) {
      var edgeDirection = edgesEntries[i].getAttribute('directed') == "true";
      if (!directional) {
         edges.push([edgesEntries[i].getAttribute('source'), edgesEntries[i].getAttribute('target'), { directional: false || edgeDirection }])
      }
      else {
         edges.push([edgesEntries[i].getAttribute('source'), edgesEntries[i].getAttribute('target'), { directional: true || edgeDirection }])
      }

   }

   return { nodes, edges };
}
/*
Parse XML file 
input: string - XML file 
output: Nodes: nodes found in the file
        Edges: edges found in the file

 */
function parseXML(xmlData) {
   // data map can be user later to reduce computation
   var dataMap = {};
   var parser = new DOMParser();
   var xmlDoc = parser.parseFromString(xmlData, "text/xml");
   // extract nodes
   var entries = xmlDoc.getElementsByTagName("entry");
   var nodes = [];
   for (var i = 0; i < entries.length; i++) {
      var g = entries[i].getElementsByTagName('graphics');
      var graphics = [];
      for (var j = 0; j < g.length; j++) {
         graphics.push(
            {
               name: g[j].getAttribute('name'),
               fgcolor: g[j].getAttribute('fgcolor'),
               bgcolor: g[j].getAttribute('bgcolor'),
               type: g[j].getAttribute('type'),
               x: g[j].getAttribute('x'),
               y: g[j].getAttribute('y'),
               width: g[j].getAttribute('width'),
               height: g[j].getAttribute('height'),
            }
         );
      }
      // create nodes
      var fullName = entries[i].getAttribute('name');
      if(fullName) fullName = fullName.replace(/.*:/,'');
      nodes.push(
         {
            id: entries[i].getAttribute('id'),
            name: fullName,
            type: entries[i].getAttribute('type'),
            link: entries[i].getAttribute('link'),
            graphics,
         }
      );
      dataMap[entries[i].getAttribute('id')] = i;
   }
   // exctract edges
   var relations = xmlDoc.getElementsByTagName("relation");
   var connections = [];
   for (var i = 0; i < relations.length; i++) {
      var s = relations[i].getElementsByTagName('subtype');
      var subtypes = [];
      for (var j = 0; j < s.length; j++) {
         subtypes.push(
            {
               name: s[j].getAttribute('name'),
               value: s[j].getAttribute('value')
            }
         );
      }
      connections.push(
         {
            entry1: relations[i].getAttribute('entry1'),
            entry2: relations[i].getAttribute('entry2'),
            type: relations[i].getAttribute('type'),
            subtypes,
         }
      );
   }
   var _edges = [];
   //var _nodes = [];
   //nodes.forEach(el => _nodes.push(el.id));
   connections.forEach(el => {
      _edges.push([el.entry1, el.entry2, {details: el}]);
   })
   return { nodes, edges: _edges };
}