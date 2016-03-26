//makes the map full-screen
        document.getElementById('view-side').style.width = '100%'
        document.getElementById('view-side').style.height = '100vh'
        document.getElementsByClassName('navbar')[0].style.marginBottom ='0px'

        //simulates onload click to activate modal
        eventFire(document.getElementById('toggle'), 'click');
        //iniitalizes count variable for next/back button
        var count = 1;
        document.getElementById('next').onclick = next
        document.getElementById('back').onclick = back
        
        
        
        //displays the next instruction 
        function next(){
            document.getElementById(count).style.display = 'none'
            count += 1
            document.getElementById('back').style.display = ''
            document.getElementById(count).style.display = 'block'
            if(count ==4){
                document.getElementById('next').style.display = 'none'
                document.getElementById('end').innerHTML = 'Get started!'
            }
        }
        //displays the previous instruction 
        function back(){
            document.getElementById(count).style.display = 'none'
            count -= 1
            document.getElementById('next').style.display = ''
            document.getElementById(count).style.display = 'block'
            
        }
        //simulates click
        function eventFire(el, etype){
          if (el.fireEvent) {
            el.fireEvent('on' + etype);
          } else {
            var evObj = document.createEvent('Events');
            evObj.initEvent(etype, true, false);
            el.dispatchEvent(evObj);
          }
        }