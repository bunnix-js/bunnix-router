import assert from 'node:assert/strict';
import { test } from 'node:test';
import Bunnix from '@bunnix/core';
import { Link } from '../../index.mjs';

test('Link updates the browser path on click', () => {
    const container = document.createElement('div');

    Bunnix.render(
        Bunnix(Link, { to: '/next' }, 'Next'),
        container
    );

    const anchor = container.querySelector('a');
    assert.ok(anchor);

    anchor.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.equal(window.location.pathname, '/next');
});
