import * as http from "http";
import {IncomingMessage, ServerResponse} from "http";
import * as fs from "fs";
import * as p from 'path'
import * as url from "url";
import {program} from 'commander';

// 指定缓存时间
let cacheAge = 3600 * 24 * 365 // 默认缓存1年
program.option('-c, --cache<max-age>', 'set cache-age(s), no cache when value is -1', value => cacheAge = parseInt(value))
program.parse(process.argv)

const server = http.createServer();

const publicDir = p.resolve(__dirname, 'public') // public路径

server.on('request', (request: IncomingMessage, response: ServerResponse) => {
  //获取请求方法 路径等
  const {method, url: path, headers} = request

  // 处理非get请求
  if (method !== 'GET') {
    response.statusCode = 405 // Method Not Allowed
    response.end()
    return
  }

  // 获取请求路径的部分内容
  const {pathname, search} = url.parse(path);
  // 获取请求文件名
  let fileName = pathname.substring(1)
  if (fileName === '') fileName = 'index.html' // 默认首页
  // 根据请求url自动返回响应文件
  fs.readFile(p.resolve(publicDir, fileName), (err, data) => {
    if (err) {
      // 文件不存在返回404页面
      if (err.errno === -2) {
        response.statusCode = 404
        fs.readFile(p.resolve(publicDir, '404.html'), (err, data) => {
          response.setHeader('Content-Type', 'text/html;charset=utf-8')
          response.end(data)
        })
      } else if (err.errno === -21) {
        response.statusCode = 403
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.end('无权查看目录内容')
      } else {
        response.statusCode = 500
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.end('服务器繁忙')
      }
    } else {
      // 返回文件内容
      if (cacheAge !== -1) {
        response.setHeader('Cache-Control', `public,max-age=${cacheAge}`)
      }
      response.end(data)
    }
  })
})

server.listen(8888)