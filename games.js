/* MY LITTLE SPACE — three entirely frontend mini-games. No backend required. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const pairs = ['🍓','🧸','🎀','🍰','🌷','🦋'];
  const memoryBoard = $('#memory-board');
  let deck = [], turned = [], moves = 0, matches = 0, locked = false, memoryRound = 0;
  function shuffle(items){ const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  function newMemory(){
    memoryRound++;
    deck=shuffle([...pairs,...pairs]).map((emoji,i)=>({emoji,id:i,matched:false,revealed:false}));
    turned=[];moves=0;matches=0;locked=false;
    $('#memory-status').textContent='Pick two cards to begin ♡';updateMemory();
  }
  function updateMemory(){
    $('#memory-moves').textContent=moves;
    $('#memory-matched').textContent=`${matches}/6`;
    memoryBoard.innerHTML=deck.map((t,i)=>`<button type="button" class="memory-tile ${t.revealed?'revealed':''} ${t.matched?'matched':''}" data-tile="${i}" ${t.matched?'disabled':''} aria-label="${t.revealed||t.matched?`${t.emoji}, ${t.matched?'matched':'revealed'}`:`Hidden card ${i+1}`}">${t.revealed||t.matched?t.emoji:'♡'}</button>`).join('');
  }
  memoryBoard.addEventListener('click',e=>{
    const button=e.target.closest('[data-tile]');if(!button||locked)return;
    const i=Number(button.dataset.tile),t=deck[i];if(!t||t.revealed||t.matched)return;
    t.revealed=true;turned.push(i);updateMemory();
    if(turned.length===2){
      moves++;
      const [a,b]=turned;
      if(deck[a].emoji===deck[b].emoji){deck[a].matched=deck[b].matched=true;turned=[];matches++;$('#memory-status').textContent=matches===6?`All matched in ${moves} moves! You did it ♡`:'Lovely match! Keep going ✿';updateMemory();}
      else{locked=true;const id=memoryRound;$('#memory-status').textContent='Not quite — give it another try!';updateMemory();setTimeout(()=>{if(id!==memoryRound)return;deck[a].revealed=deck[b].revealed=false;turned=[];locked=false;updateMemory();},820);}
    }
  });
  $('#memory-reset').addEventListener('click',newMemory);
  newMemory();

  /* Tic-tac-toe: human flowers (🌸), computer hearts (♡) */
  const winLines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const tttBoard=$('#ttt-board');
  let board=[],over=false,computing=false,tttRound=0;
  function winner(state,sign){return winLines.find(line=>line.every(i=>state[i]===sign));}
  function drawTTT(highlight=[]){
    tttBoard.innerHTML=board.map((x,i)=>`<button type="button" class="ttt-cell ${x==='O'?'computer':''} ${highlight.includes(i)?'winner':''}" data-cell="${i}" ${over||computing||x?'disabled':''} aria-label="Row ${Math.floor(i/3)+1}, column ${i%3+1}: ${x==='X'?'flower':x==='O'?'heart':'empty'}">${x==='X'?'🌸':x==='O'?'♡':''}</button>`).join('');
  }
  function startTTT(){tttRound++;board=Array(9).fill('');over=false;computing=false;$('#ttt-status').textContent='Your turn! Pick a square 🌸';drawTTT();}
  function aiMove(){
    const available=board.map((x,i)=>x=== ''?i:null).filter(i=>i!==null);
    if(!available.length)return -1;
    function tactical(sign){return available.find(i=>{const next=[...board];next[i]=sign;return Boolean(winner(next,sign));});}
    const win=tactical('O'); if(win!==undefined)return win;
    const block=tactical('X'); if(block!==undefined)return block;
    if(available.includes(4))return 4;
    const corners=shuffle([0,2,6,8]).filter(i=>available.includes(i));
    return corners[0]??shuffle(available)[0];
  }
  function checkOutcome(symbol){
    const line=winner(board,symbol);
    if(line){over=true;$('#ttt-status').textContent=symbol==='X'?'You win! Flower power 🌸':'The little heart wins this time ♡';drawTTT(line);return true;}
    if(board.every(Boolean)){over=true;$('#ttt-status').textContent='A cozy little tie! Play again? ♡';drawTTT();return true;}
    return false;
  }
  tttBoard.addEventListener('click',e=>{
    const cell=e.target.closest('[data-cell]');if(!cell||over||computing)return;
    const i=Number(cell.dataset.cell);if(board[i])return;
    board[i]='X';drawTTT();if(checkOutcome('X'))return;
    computing=true;$('#ttt-status').textContent='Thinking of a move... ♡';drawTTT();const id=tttRound;
    setTimeout(()=>{if(id!==tttRound)return;const move=aiMove();if(move<0)return;board[move]='O';computing=false;drawTTT();if(!checkOutcome('O'))$('#ttt-status').textContent='Your turn again 🌸';},420);
  });
  $('#ttt-reset').addEventListener('click',startTTT);
  startTTT();

  /* A little lucky note */
  const letters=[
    'You don’t need to do everything today. Just the next kind thing. ♡',
    'Someone out there is glad you exist — including future you. 🌷',
    'A fresh start can be as small as a deep breath and a cup of tea. ☕',
    'Little steps count, even when nobody else sees them. ✧',
    'You are allowed to have a slow day and still be proud of yourself. ♡',
    'There is room for rest, wonder, and your own kind of magic. ✿',
    'You have made it through every tricky day so far. Be gentle with yourself. 💌',
    'Go find one small beautiful thing today. That’s enough. 🍓'
  ];
  let last=-1;
  $('#fortune-open').addEventListener('click',()=>{
    let i=Math.floor(Math.random()*letters.length);
    if(i===last)i=(i+1)%letters.length;
    last=i;$('#fortune-text').textContent=letters[i];
    $('#fortune-open').textContent='✉ Another little letter';
  });
})();
