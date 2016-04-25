var input = document.getElementsByTagName('input');
var button = document.getElementsByTagName('button');
var form = document.getElementsByTagName('form');

  for(var i=0; i<input.length; i++){
    input[i].className = 'form-control';
  }

button[0].className = 'braquet-btn';


form[0].style.width = '50%';
form[0].style.float = 'left';  
form[0].style.marginRight = '40px';  

