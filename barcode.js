async function SetupVideo() {

    let barcode = null;
    const canvas = document.querySelector('canvas');
    const vid = document.querySelector('video')

    canvas.width = 720 
    canvas.height = 720

    // barcode detector
    if(!("BarcodeDetector" in globalThis)) {
        document.write('<h1>Barcode Detector is not there</h1>');
    }
    else {
        barcode = new BarcodeDetector({
            formats: await BarcodeDetector.getSupportedFormats()
        });
    }

    // get the video stream dwag
	const str = navigator.mediaDevices;
	if(str == undefined)
		return undefined

	const vidSrc = await str.getUserMedia({video: { facingMode: {exact: 'environment'}, width: canvas.width, height: canvas.height}});
    vid.srcObject = vidSrc;

    console.log(barcode);

    const section = document.querySelector('#section');

    const gfx = canvas.getContext('2d');
    gfx.fillRect(0, 0, canvas.width, canvas.height);

    let current = undefined;
    let raw = '';
    let pungent = '';

    const button = document.querySelector('#read')
    button.onclick = async function wokash() {

        if(current)
        { 
            section.innerHTML = '<div style="color:darkred; font-weight:bold; font-size:2em;">Loading...</div>';
            const sheet = await GetSheet(current.event_name);

            // get the rows that have the things
            const first_name = current.names[0].toLowerCase().replace(/ +/g, '')
            let serial_nos = sheet.reduce((a, e, i) => {
                const k = e.search(first_name)
                if(k >= 0) {
                    a.push(i+1)
                }
                return a
            }, []) 

            console.log(serial_nos)
            if(serial_nos.length == 0)
                serial_nos = current.serial_no
            else
                serial_nos = serial_nos.join(' ')


            let croaker = ''
            for(let pname of current.names) {
                croaker += `<tr>
                    <td>${serial_nos}</td>
                    <td>${current.event_name}</td>
                    <td>${current.team_name}</td>
                    <td>${pname}</td>
                </tr>
                `
            }
            croaker += `<tr>
                        <th style='background:goldenrod'>Email: </th>
                        <td style='background:goldenrod' colspan=3>${current.email}</td>
                    </tr>`

            section.innerHTML = croaker;
        }
        current = undefined;
        pungent += raw + '\n';
    }

    const download = document.querySelector('#download')
    download.onclick = function wooo() {
        const blob = new Blob([pungent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tickets-register.csv';
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async function animate() {
        try {
            const arr = await barcode.detect(vid)
            gfx.drawImage(vid, 0, 0);
            for(const a of arr) {

                console.log()
                
                gfx.beginPath()
                gfx.lineWidth = 5;
                gfx.strokeStyle = 'red';
                gfx.moveTo(a.cornerPoints[0].x, a.cornerPoints[0].y);
                for(let i = 1; i < a.cornerPoints.length; i++)
                {
                    gfx.lineTo(a.cornerPoints[i].x, a.cornerPoints[i].y);
                }
                gfx.lineTo(a.cornerPoints[0].x, a.cornerPoints[0].y);
                gfx.stroke();

                const data = a.rawValue.split('\n')
                raw = data.join(', ')

                current = {
                    event_name: data[0],
                    team_name: data[1],
                    serial_no: data[2],
                    names: data.slice(3, data.length - 1),
                    email: data[data.length-1]
                }
            }
        }
        catch(e) {
            console.log('bruh');
        }
        requestAnimationFrame(animate);
    }
    await animate();
}

async function GetSheet(event_name) {
    if(event_name in sheet_cache) {
        return sheet_cache[event_name]
    }

    // get the thing from appscript
    try {

        let text = localStorage.getItem(event_name);

        if(text == null)
        {
            const thing = await fetch(`${appscript_url}?password=${password}&event_name=${event_name}`)
            text = await thing.text()
            localStorage.setItem(event_name, text);
        }

        // take out all the white space and conver to lowercase just to facilitate the search
        const header = text.split('\n')
        sheet_cache[event_name] = header.splice(1).map(a => a.toLowerCase().replace(/ +/g, ''))

        if(header[0].search('NOT') >= 0)
        {
            window.alert('Something went wrong at retrieval man')
        }

    }
    catch(e) {
        sheet_cache[event_name] = ['Something Went Terribly Wrong man idk']
    }

    return sheet_cache[event_name]
}

// We will connect the thingburger
const appscript_url = "https://script.google.com/macros/s/AKfycbzTallCs4nTluaGT09I31qpShKkpm8IZWdk-LL7Q4JMHnmV0I4ONOnjytjtU1wbNBjr9A/exec"
// const appscript_url = '/codeplay.csv'
const urlargs = new URLSearchParams(window.location.search);
const password = urlargs.get('password')//''

// refresh localstorage every 6 hours
const current = new Date()
const time = localStorage.getItem('lastSaved')
if(time == null || current - new Date(time) > 2.16E7)
{
    // reset the thing
    localStorage.clear()
    localStorage.setItem('lastSaved', new Date().toISOString())
}

const sheet_cache = {}

SetupVideo();
