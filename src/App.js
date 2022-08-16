import logo from './logo.svg';
import './App.css';
import { ReactSortable } from "react-sortablejs";
import { useState } from 'react';

function App() {

  const [aze, setaze] = useState([
    {
      title: 'aze 1',
      style: {height: '100px', width: '100px', border: '1px solid black'},
    },
    {
      title: 'aze 2',
      style: {height: '200px', width: '100px', border: '1px solid black'},
    },
    {
      title: 'aze 3',
      style: {height: '100px', width: '400px', border: '1px solid black'},
    },
    {
      title: 'aze 4',
      style: {height: '100px', width: '100px', border: '1px solid black'},
    },
    {
      title: 'aze 5',
      style: {height: '100px', width: '100px', border: '1px solid black'},
    },
  ])
  return (
    <ReactSortable list={aze} setList={setaze} className="App" style={{padding: '10px', display: 'flex', flexWrap: 'wrap', gap: '15px' , border: '1px solid black'}}>
      {aze.map( (a,i) => <Aze a={a} key={i} /> )}
      </ReactSortable>
  );
}

export default App;


function Aze({a, i}) {
  
  return (
    
    <div style={a.style} >
        {a.title}
      </div>
  )
}
