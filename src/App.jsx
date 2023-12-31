import { useState } from "react";
import { useDidUpdate } from "@mantine/hooks";

import "./App.css";

const thinSpace = String.fromCharCode(8201);
const accent = String.fromCharCode(0x0301);
const tie = String.fromCharCode(865);

async function getTextFromStream(readableStream) {
  let reader = readableStream.getReader();
  let decoder = new TextDecoder("ISO-8859-1");
  let nextChunk;
  
  let resultStr = '';
  
  while (!(nextChunk = await reader.read()).done) {
      let partialData = nextChunk.value;
      resultStr += decoder.decode(partialData);
  }
  
  return resultStr;
}

function App() {
  const [field, setField] = useState("");
  const [lastWord, setLastWord] = useState("");
  const [results, setResults] = useState([]);

  function getIPAs(html) {
    const htmlElem = document.createElement("html");
    htmlElem.innerHTML = html
      .replaceAll("&#x0283", "&#x0283;&#x02B7").replaceAll("&#x0292", "&#x0292;&#x02B7")
      .replaceAll("&#x02A7", "t&#800;&#643;&#x02B7").replaceAll("&#x02A4", "d&#800;&#658;&#x02B7")
      .replaceAll("&#x0279", "&#x0279;&#800;&#x02B7").replaceAll("h&#8201;j", "&#231;");
    return [...htmlElem.querySelectorAll(".ipa")].map(e => e.innerText);
  }

  function getWords(html) {
    const htmlElem = document.createElement("html");
    htmlElem.innerHTML = html;
    return [...htmlElem.querySelectorAll("table.res td:has(> a)")]
    .map(e => e.innerText.substring(0, e.innerText.length - 2).toLowerCase());
  }

  useDidUpdate(() => {
    (async () => {
      const [res1, res2] = await Promise.all([
        fetch(`https://cors-anywhere.herokuapp.com/http://seas.elte.hu/cube/index.pl?s=${escape(lastWord)}&fullw=on&invr=on&goal=on`),
        fetch(`https://cors-anywhere.herokuapp.com/http://seas.elte.hu/cube/index.pl?s=${escape(lastWord)}&fullw=on&invr=on&goal=on&thop=on`)
      ]);
  
      const [html1, html2] = await Promise.all([
        getTextFromStream(res1.body), getTextFromStream(res2.body)
      ]);

      let [none, thop] = [getIPAs(html1), getIPAs(html2)];
      
      if (none.length === 0) {
        setResults(["no results"]);
        return () => {};
      }
      
      thop.forEach((e, i) => {
        [...e].forEach((c, index) => {
          if (c === "ʰ") {
            none[i] = none[i].substring(0, index) + "ʰ" + thinSpace
            + none[i].substring(index + 1);
          }
        });
      });
      
      const wordList = getWords(html1);
      none = none.filter((e, i) => wordList[i] === lastWord.trim().toLowerCase());
      none = none.map(e => {
        return e.split(thinSpace).map(ele => {
          if (ele.length > 1) {
            if (ele.length == 2 && ele[1] !== accent && ele[1] !== "ː" && ele[1] !== "ʰ" &&
              ele[1] !== "ʷ") {
              return ele[0] + tie + thinSpace + ele[1];
            }
            else if (ele.length > 2 && ele[2] !== "ː" && ele[2] !== "ʷ") {
              return ele.substring(0, 2) + tie + thinSpace + ele.substring(2);
            }
          }
          return ele;
        }).join(thinSpace);
      });
  
      setResults(none.length ? [...new Set(none)] : ["no results"]);
    })();
  }, [lastWord]);

  return (
    <div className="App">
      <form onSubmit={async e => {
        e.preventDefault();

        setLastWord(field);
        setResults(["searching"]);
      }}>
        <input type="search" value={field} onChange={e => setField(e.target.value)} />
        <input type="submit" value="search" />
      </form>
      <ul>
        {results.map((e, i) => <li className="ipa" key={i}>{e}</li>)}
      </ul> 
    </div>
  );
}

export default App;