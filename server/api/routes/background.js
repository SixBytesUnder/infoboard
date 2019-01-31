const {Router} = require('express')
const router = Router()
const path = require('path')
const url = require('url')
const glob = require('glob')
const fs = require('fs')
require('dotenv').config()
const mainDir = process.env.IMAGES_DIR

function findNextDir (startPath, lastDir) {
	let files = []
	let dirList = fs.readdirSync(startPath)
	let ignoreDirs = []
	let normalizedMainDir = path.normalize(mainDir)
	
	// if last dir is provided and exists in the list exclude all directiries up to this one from glob
	if (lastDir !== '') {
		for (let dirToIgnore of dirList) {
			ignoreDirs.push(dirToIgnore)
			if (dirToIgnore === lastDir) {
				break
			}
		}
		// if ignore list contains all dirs, means we're starting from first dir
		let dirListFiltered = dirList.filter(function (val) {
			return (ignoreDirs.indexOf(val) === -1)
		})
		if (dirListFiltered.length !== 0) {
			dirList = dirListFiltered
		}
	}

	for (let asset of dirList) {
		let fullPath = path.join(startPath, asset)
		if (fs.statSync(fullPath).isDirectory()) {
			files = glob.sync('**/*.+(jpg|jpeg)', {
				cwd: fullPath,
				nocase: true,
				realpath: true
			})
			if (files.length > 0) {
				// clean paths to be relative
				let filesShort = files.map(function (x) { return x.replace(normalizedMainDir, '') })
				return filesShort
			}
		} else {
			files.push(asset)
			// return that one file
			return files
		}
	}
}

router.get('/backgrounds/*', (req, res) => {
	let files = []
	let reqPath = url.parse(req.url).pathname
	let lastPath = ''
	// split on first / then match this to only folder
	preLastPath = decodeURIComponent(reqPath.replace('/backgrounds/', ''))
	lastPath = preLastPath.substring(0, preLastPath.indexOf('/'))
	if (lastPath == '') {
		lastPath = preLastPath
	}
	files = findNextDir(mainDir, lastPath)
	res.json(files)
})

// path to get the file from outside of root project directory
router.get('/background/:file(*)', (req, res) => {
	var fullPath = path.join(mainDir, req.params.file)
	var s = fs.createReadStream(fullPath)
	s.on('open', function () {
		res.set('Content-Type', 'image/jpeg')
		s.pipe(res)
	})
	s.on('error', function () {
		res.set('Content-Type', 'text/plain')
		// res.send(fullPath)
		res.status(404).end(`File: ${fullPath} counld not be found`)
	})
})

module.exports = router
