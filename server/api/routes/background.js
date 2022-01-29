const path = require('path')
const fs = require('fs')
const glob = require('glob')
const { Router } = require('express')
const router = Router()
require('dotenv').config()
const mainDir = process.env.IMAGES_DIR
const videoMP4 = process.env.VIDEO === 'true'

function findNextDir(startPath, lastDir) {
	let files = []
	let dirList = fs.readdirSync(startPath)
	// filter out video files as per config
	const allowedFormats = videoMP4 ? ['jpg', 'jpeg', 'png', 'mp4'] : ['jpg', 'jpeg', 'png']
	dirList = dirList.filter((file) => {
		if (file.includes('.')) {
			return allowedFormats.includes(file.split('.').pop().toLowerCase())
		} else {
			return file
		}
	})
	const ignoreDirs = []
	const normalizedMainDir = path.normalize(mainDir)

	// if last dir is provided and exists in the list exclude all directiries up to this one from glob
	if (lastDir !== '') {
		for (const dirToIgnore of dirList) {
			ignoreDirs.push(dirToIgnore)
			if (dirToIgnore === lastDir) {
				break
			}
		}
		// if ignore list contains all dirs, means we're starting from first dir
		const dirListFiltered = dirList.filter(function(val) {
			return (!ignoreDirs.includes(val))
		})
		if (dirListFiltered.length !== 0) {
			dirList = dirListFiltered
		}
	}

	for (const asset of dirList) {
		const fullPath = path.join(startPath, asset)
		if (fs.statSync(fullPath).isDirectory()) {
			const pattern = videoMP4 ? '**/*.+(jpg|jpeg|png|mp4)' : '**/*.+(jpg|jpeg|png)'
			files = glob.sync(pattern, {
				cwd: fullPath,
				nocase: true,
				realpath: true
			})
			if (files.length > 0) {
				// clean paths to be relative
				const filesShort = files.map(function(x) { return x.replace(normalizedMainDir, '') })
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
	let lastPath = ''
	// split on first / then match this to only folder
	const preLastPath = decodeURIComponent(req.url.replace('/backgrounds/', ''))
	lastPath = preLastPath.substring(0, preLastPath.indexOf('/'))
	if (lastPath === '') {
		lastPath = preLastPath
	}
	files = findNextDir(mainDir, lastPath)
	res.json(files)
})

// path to get the file from outside of root project directory
router.get('/background/:file(*)', (req, res) => {
	const fullPath = path.join(mainDir, req.params.file)
	const s = fs.createReadStream(fullPath)
	s.on('open', function() {
		if (req.params.file.split('.').pop().toLowerCase() === 'mp4') {
			res.set('Content-Type', 'video/mp4')
		} else {
			res.set('Content-Type', 'image/jpeg')
		}
		s.pipe(res)
	})
	s.on('error', function() {
		res.set('Content-Type', 'text/plain')
		res.status(404).end(`File: ${fullPath} counld not be found`)
	})
})

module.exports = router
