

module.exports = {
    apps: [{
        name: "poker0K",
        script: "./dist/index.js",
        env: {
            NODE_ENV: "production",
            PM2_io: "false",
        }
    }]
}