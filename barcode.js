function printObject(str) {
	if((str) instanceof Object)
	{
		for(let t in str) {
			const prop = document.createElement('div')
			prop.innerText = t + ' : ' + str[t]
			document.body.appendChild(prop)
		}
	}
	else
	{
		const prop = document.createElement('div')
		prop.innerText = str
		document.body.appendChild(prop)
	}
}

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

    let current = '';
    let raw = '';
    let pungent = '';

    const button = document.querySelector('#read')
    button.onclick = function wokash() {
        if(current != '')
        { 
            section.innerHTML = current;
        }
        current = '';
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

                const eve_name = data[0]
                const team_name = data[1]
                const serial_no = data[2]
                const names = data.slice(3, data.length - 1)
                const email = data[data.length-1]

                current = ''
                for(let pname of names) {
                current += `<tr>
                    <td>${serial_no}</td>
                    <td>${eve_name}</td>
                    <td>${team_name}</td>
                    <td>${pname}</td>
                </tr>
                `
                }
                current += `<tr>
                        <th style='background:goldenrod'>Email: </th>
                        <td style='background:goldenrod' colspan=3>Hello@gmail.com</td>
                    </tr>`
            }
        }
        catch(e) {
            console.log('bruh');
        }
        requestAnimationFrame(animate);
    }
    await animate();
}

SetupVideo();
