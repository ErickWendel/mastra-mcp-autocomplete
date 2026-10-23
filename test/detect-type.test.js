import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectType } from '../src/lib/detect-type.js'

test('detects the type from the URL', () => {
    assert.equal(detectType('https://youtu.be/VhwIJrhjqcQ'), 'video')
    assert.equal(detectType('https://www.youtube.com/watch?v=VhwIJrhjqcQ'), 'video')
    assert.equal(detectType('https://www.linkedin.com/posts/erickwendel_abc'), 'post')
    assert.equal(detectType('https://dev.to/erickwendel/some-post'), 'post')
    assert.equal(detectType('https://jsconf.com/speakers'), 'talk')
})
