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
		// if ignore list contains all dirs, means we starting from first dir
		let dirListFiltered = dirList.filter(function (val) {
			return (ignoreDirs.indexOf(val) === -1)
		})
		if (dirListFiltered.length !== 0) {
			dirList = dirListFiltered
		}
	}

	for (let dir of dirList) {
		let fullPath = path.join(startPath, dir)
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
			// return that one file
			return [dir]
		}
	}
}

router.get('/backgrounds/*', (req, res) => {
	let files = []
	let reqPath = url.parse(req.url).pathname
	let lastPath = ''
	// split on first / then match this to only folder
	lastPath = decodeURIComponent(reqPath.replace('/backgrounds/', ''))
	lastPath = lastPath.substring(0, lastPath.indexOf('/'))
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
