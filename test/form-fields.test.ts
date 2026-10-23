import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fieldKind } from '../public/js/form/field-kind.ts'
import { fieldValues } from '../public/js/form/field-values.ts'

test('each JSON Schema property becomes the right kind of input', () => {
    assert.deepEqual(fieldKind('title', { type: ['string', 'null'] }), { kind: 'text' })
    assert.deepEqual(fieldKind('summary', { type: ['string', 'null'] }), { kind: 'textarea' })
    assert.deepEqual(fieldKind('attendees', { type: ['number', 'null'] }), { kind: 'number' })
    assert.deepEqual(fieldKind('tags', { anyOf: [{ type: 'array' }, { type: 'null' }] }), { kind: 'tags' })
    assert.deepEqual(fieldKind('language', { anyOf: [{ type: 'string', enum: ['pt-br', 'es'] }, { type: 'null' }] }), { kind: 'select', options: ['pt-br', 'es'] })
})

test('values go into inputs as text and come back typed', () => {
    assert.equal(fieldValues.toInput('tags', ['ai', 'node']), 'ai, node')
    assert.deepEqual(fieldValues.fromInput('tags', ' ai, node ,, '), ['ai', 'node'])
    assert.equal(fieldValues.fromInput('number', '300'), 300)
    assert.equal(fieldValues.fromInput('text', '  JSConf  '), 'JSConf')
})
