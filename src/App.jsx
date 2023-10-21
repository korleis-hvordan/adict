import { useState } from "react";

import "./App.css";

function App() {
  const [field, setField] = useState("");

  const [results, setResults] = useState([]);

  function getIPAs(html) {
    const htmlElem = document.createElement("html");
    htmlElem.innerHTML = html;
    return [...htmlElem.querySelectorAll(".ipa")].map(e => e.innerText);
  }

  function getWords(html) {
    const htmlElem = document.createElement("html");
    htmlElem.innerHTML = html;
    return [...htmlElem.querySelectorAll("table.res td:has(> a)")]
    .map(e => e.innerText.substring(0, e.innerText.length - 2));
  }

  return (
    <div className="App">
      <form onSubmit={async e => {
        e.preventDefault();

        const [res1, res2, res3] = await Promise.all([
          fetch(`https://cors-anywhere.herokuapp.com/http://seas.elte.hu/cube/index.pl?s=${field}&fullw=on&invr=on`),
          fetch(`https://cors-anywhere.herokuapp.com/http://seas.elte.hu/cube/index.pl?s=${field}&fullw=on&invr=on&asp=on`),
          fetch(`https://cors-anywhere.herokuapp.com/http://seas.elte.hu/cube/index.pl?s=${field}&fullw=on&invr=on&thop=on`)
        ]);
        const [html1, html2, html3] = await Promise.all([
          res1.text(), res2.text(), res3.text()
        ]);

        let [none, asp, thop] = [getIPAs(html1), getIPAs(html2), getIPAs(html3)];
        none.forEach((e, i) => {
          [...e].forEach((c, index) => {
            if (c !== asp[i][index]) {
              thop[i] = thop[i].substring(0, index) + "t" + thop[i].substring(index + 1);
            }
          });
        });

        const wordList = getWords(html3);
        setResults(thop.filter((e, i) => wordList[i] === field.trim()));
      }}>
        <input type="search" value={field} onChange={e => setField(e.target.value)} />
        <input type="submit" value="search" />
        <input type="checkbox" />multiple words (slow)
      </form>
      <ul>
        {results.map(e => <li className="ipa">{e}</li>)}
      </ul>
    </div>
  );
}

export default App;