function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
let src_url_equal_anchor;
function src_url_equal(element_src, url) {
    if (!src_url_equal_anchor) {
        src_url_equal_anchor = document.createElement('a');
    }
    src_url_equal_anchor.href = url;
    return element_src === src_url_equal_anchor.href;
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}
function get_all_dirty_from_scope($$scope) {
    if ($$scope.ctx.length > 32) {
        const dirty = [];
        const length = $$scope.ctx.length / 32;
        for (let i = 0; i < length; i++) {
            dirty[i] = -1;
        }
        return dirty;
    }
    return -1;
}
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== '$')
            result[k] = props[k];
    return result;
}
function compute_rest_props(props, keys) {
    const rest = {};
    keys = new Set(keys);
    for (const k in props)
        if (!keys.has(k) && k[0] !== '$')
            rest[k] = props[k];
    return rest;
}
function compute_slots(slots) {
    const result = {};
    for (const key in slots) {
        result[key] = true;
    }
    return result;
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

const tasks = new Set();
function run_tasks(now) {
    tasks.forEach(task => {
        if (!task.c(now)) {
            tasks.delete(task);
            task.f();
        }
    });
    if (tasks.size !== 0)
        raf(run_tasks);
}
/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */
function loop(callback) {
    let task;
    if (tasks.size === 0)
        raf(run_tasks);
    return {
        promise: new Promise(fulfill => {
            tasks.add(task = { c: callback, f: fulfill });
        }),
        abort() {
            tasks.delete(task);
        }
    };
}
function append(target, node) {
    target.appendChild(node);
}
function get_root_for_style(node) {
    if (!node)
        return document;
    const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
    if (root && root.host) {
        return root;
    }
    return node.ownerDocument;
}
function append_empty_stylesheet(node) {
    const style_element = element('style');
    append_stylesheet(get_root_for_style(node), style_element);
    return style_element;
}
function append_stylesheet(node, style) {
    append(node.head || node, style);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
    // @ts-ignore
    const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
    for (const key in attributes) {
        if (attributes[key] == null) {
            node.removeAttribute(key);
        }
        else if (key === 'style') {
            node.style.cssText = attributes[key];
        }
        else if (key === '__value') {
            node.value = node[key] = attributes[key];
        }
        else if (descriptors[key] && descriptors[key].set) {
            node[key] = attributes[key];
        }
        else {
            attr(node, key, attributes[key]);
        }
    }
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail, bubbles = false) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, bubbles, false, detail);
    return e;
}

const active_docs = new Set();
let active = 0;
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash$2(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash$2(rule)}_${uid}`;
    const doc = get_root_for_style(node);
    active_docs.add(doc);
    const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
    const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
    if (!current_rules[name]) {
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    const previous = (node.style.animation || '').split(', ');
    const next = previous.filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    );
    const deleted = previous.length - next.length;
    if (deleted) {
        node.style.animation = next.join(', ');
        active -= deleted;
        if (!active)
            clear_rules();
    }
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        active_docs.forEach(doc => {
            const stylesheet = doc.__svelte_stylesheet;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            doc.__svelte_rules = {};
        });
        active_docs.clear();
    });
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
}
function getContext(key) {
    return get_current_component().$$.context.get(key);
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        // @ts-ignore
        callbacks.slice().forEach(fn => fn.call(this, event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
const null_transition = { duration: 0 };
function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function init(program, duration) {
        const d = (program.b - t);
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }
    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.r += 1;
        }
        if (running_program || pending_program) {
            pending_program = program;
        }
        else {
            // if this is an intro, and there's a delay, we need to do
            // an initial tick and/or apply CSS animation immediately
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now => {
                if (pending_program && now > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now >= running_program.end) {
                        tick(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now >= running_program.start) {
                        const p = now - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    // @ts-ignore
                    config = config();
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
    const o = +getComputedStyle(node).opacity;
    return {
        delay,
        duration,
        easing,
        css: t => `opacity: ${t * o}`
    };
}

/* src/alert/Alert.svelte generated by Svelte v3.44.2 */
const get_action_slot_changes = dirty => ({});
const get_action_slot_context = ctx => ({});
const get_title_slot_changes$4 = dirty => ({});
const get_title_slot_context$4 = ctx => ({ class: "font-semibold" });
const get_icon_slot_changes = dirty => ({});
const get_icon_slot_context = ctx => ({});

// (23:0) {#if open}
function create_if_block$5(ctx) {
	let div4;
	let div3;
	let div0;
	let t0;
	let div2;
	let div1;
	let t1;
	let t2;
	let div4_class_value;
	let div4_transition;
	let current;
	const icon_slot_template = /*#slots*/ ctx[4].icon;
	const icon_slot = create_slot(icon_slot_template, ctx, /*$$scope*/ ctx[3], get_icon_slot_context);
	const title_slot_template = /*#slots*/ ctx[4].title;
	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[3], get_title_slot_context$4);
	const default_slot_template = /*#slots*/ ctx[4].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
	const action_slot_template = /*#slots*/ ctx[4].action;
	const action_slot = create_slot(action_slot_template, ctx, /*$$scope*/ ctx[3], get_action_slot_context);
	const action_slot_or_fallback = action_slot || fallback_block$1(ctx);

	return {
		c() {
			div4 = element("div");
			div3 = element("div");
			div0 = element("div");
			if (icon_slot) icon_slot.c();
			t0 = space();
			div2 = element("div");
			div1 = element("div");
			if (title_slot) title_slot.c();
			t1 = space();
			if (default_slot) default_slot.c();
			t2 = space();
			if (action_slot_or_fallback) action_slot_or_fallback.c();
			attr(div0, "class", "mr-4 flex items-center justify-center text-center");
			attr(div1, "class", "font-semibold");
			attr(div2, "class", "flex-1 flex flex-col");
			attr(div3, "class", "w-full flex");
			attr(div4, "class", div4_class_value = "alert alert-" + /*variant*/ ctx[2] + " " + /*className*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div4, anchor);
			append(div4, div3);
			append(div3, div0);

			if (icon_slot) {
				icon_slot.m(div0, null);
			}

			append(div3, t0);
			append(div3, div2);
			append(div2, div1);

			if (title_slot) {
				title_slot.m(div1, null);
			}

			append(div2, t1);

			if (default_slot) {
				default_slot.m(div2, null);
			}

			append(div3, t2);

			if (action_slot_or_fallback) {
				action_slot_or_fallback.m(div3, null);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (icon_slot) {
				if (icon_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						icon_slot,
						icon_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(icon_slot_template, /*$$scope*/ ctx[3], dirty, get_icon_slot_changes),
						get_icon_slot_context
					);
				}
			}

			if (title_slot) {
				if (title_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						title_slot,
						title_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(title_slot_template, /*$$scope*/ ctx[3], dirty, get_title_slot_changes$4),
						get_title_slot_context$4
					);
				}
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
						null
					);
				}
			}

			if (action_slot) {
				if (action_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						action_slot,
						action_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(action_slot_template, /*$$scope*/ ctx[3], dirty, get_action_slot_changes),
						get_action_slot_context
					);
				}
			} else {
				if (action_slot_or_fallback && action_slot_or_fallback.p && (!current || dirty & /*open*/ 1)) {
					action_slot_or_fallback.p(ctx, !current ? -1 : dirty);
				}
			}

			if (!current || dirty & /*variant, className*/ 6 && div4_class_value !== (div4_class_value = "alert alert-" + /*variant*/ ctx[2] + " " + /*className*/ ctx[1])) {
				attr(div4, "class", div4_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(icon_slot, local);
			transition_in(title_slot, local);
			transition_in(default_slot, local);
			transition_in(action_slot_or_fallback, local);

			add_render_callback(() => {
				if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, { duration: 100 }, true);
				div4_transition.run(1);
			});

			current = true;
		},
		o(local) {
			transition_out(icon_slot, local);
			transition_out(title_slot, local);
			transition_out(default_slot, local);
			transition_out(action_slot_or_fallback, local);
			if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, { duration: 100 }, false);
			div4_transition.run(0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div4);
			if (icon_slot) icon_slot.d(detaching);
			if (title_slot) title_slot.d(detaching);
			if (default_slot) default_slot.d(detaching);
			if (action_slot_or_fallback) action_slot_or_fallback.d(detaching);
			if (detaching && div4_transition) div4_transition.end();
		}
	};
}

// (38:23)      
function fallback_block$1(ctx) {
	let div;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			div.textContent = "×";
			attr(div, "class", "w-5 h-5 flex items-center justify-center text-center rounded-full text-white bg-black bg-opacity-20 hover:bg-opacity-30");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (!mounted) {
				dispose = listen(div, "click", /*click_handler*/ ctx[5]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$v(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*open*/ ctx[0] && create_if_block$5(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*open*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*open*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$5(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance$u($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { variant = 'info' } = $$props;
	let { open = true } = $$props;
	const click_handler = () => $$invalidate(0, open = !open);

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(1, className = $$props.class);
		if ('variant' in $$props) $$invalidate(2, variant = $$props.variant);
		if ('open' in $$props) $$invalidate(0, open = $$props.open);
		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
	};

	return [open, className, variant, $$scope, slots, click_handler];
}

class Alert extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$u, create_fragment$v, safe_not_equal, { class: 1, variant: 2, open: 0 });
	}
}

/* src/avatar/Avatar.svelte generated by Svelte v3.44.2 */

function create_if_block_1$2(ctx) {
	let span;
	let t;
	let span_class_value;

	return {
		c() {
			span = element("span");
			t = text(/*label*/ ctx[4]);
			attr(span, "class", span_class_value = "w-full h-full " + /*shapes*/ ctx[7][/*shape*/ ctx[3]] + " bg-neutral-focus text-neutral-content text-center flex items-center justify-center");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},
		p(ctx, dirty) {
			if (dirty & /*label*/ 16) set_data(t, /*label*/ ctx[4]);

			if (dirty & /*shape*/ 8 && span_class_value !== (span_class_value = "w-full h-full " + /*shapes*/ ctx[7][/*shape*/ ctx[3]] + " bg-neutral-focus text-neutral-content text-center flex items-center justify-center")) {
				attr(span, "class", span_class_value);
			}
		},
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

// (55:1) {#if typeof image !== 'undefined'}
function create_if_block$4(ctx) {
	let img;
	let img_class_value;
	let img_src_value;

	return {
		c() {
			img = element("img");
			attr(img, "class", img_class_value = /*shapes*/ ctx[7][/*shape*/ ctx[3]]);
			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[6])) attr(img, "src", img_src_value);
			attr(img, "alt", /*label*/ ctx[4]);
		},
		m(target, anchor) {
			insert(target, img, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*shape*/ 8 && img_class_value !== (img_class_value = /*shapes*/ ctx[7][/*shape*/ ctx[3]])) {
				attr(img, "class", img_class_value);
			}

			if (dirty & /*image*/ 64 && !src_url_equal(img.src, img_src_value = /*image*/ ctx[6])) {
				attr(img, "src", img_src_value);
			}

			if (dirty & /*label*/ 16) {
				attr(img, "alt", /*label*/ ctx[4]);
			}
		},
		d(detaching) {
			if (detaching) detach(img);
		}
	};
}

function create_fragment$u(ctx) {
	let div;
	let div_class_value;

	function select_block_type(ctx, dirty) {
		if (typeof /*image*/ ctx[6] !== 'undefined') return create_if_block$4;
		if (/*label*/ ctx[4]) return create_if_block_1$2;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type && current_block_type(ctx);

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "class", div_class_value = "avatar " + /*sizes*/ ctx[8][/*size*/ ctx[5]] + " " + /*className*/ ctx[0]);
			toggle_class(div, "online", /*online*/ ctx[1]);
			toggle_class(div, "offline", /*offline*/ ctx[2]);
			toggle_class(div, "placeholder", /*label*/ ctx[4] && !/*image*/ ctx[6]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
		},
		p(ctx, [dirty]) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if (if_block) if_block.d(1);
				if_block = current_block_type && current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div, null);
				}
			}

			if (dirty & /*size, className*/ 33 && div_class_value !== (div_class_value = "avatar " + /*sizes*/ ctx[8][/*size*/ ctx[5]] + " " + /*className*/ ctx[0])) {
				attr(div, "class", div_class_value);
			}

			if (dirty & /*size, className, online*/ 35) {
				toggle_class(div, "online", /*online*/ ctx[1]);
			}

			if (dirty & /*size, className, offline*/ 37) {
				toggle_class(div, "offline", /*offline*/ ctx[2]);
			}

			if (dirty & /*size, className, label, image*/ 113) {
				toggle_class(div, "placeholder", /*label*/ ctx[4] && !/*image*/ ctx[6]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);

			if (if_block) {
				if_block.d();
			}
		}
	};
}

function instance$t($$self, $$props, $$invalidate) {
	let { class: className = '' } = $$props;
	let { online = false } = $$props;
	let { offline = false } = $$props;
	let { shape = 'circle' } = $$props;
	let { label = undefined } = $$props;
	let { size = getContext('avatar:size') ?? 'md' } = $$props;
	let { image = undefined } = $$props;

	let shapes = {
		circle: 'rounded-full',
		rounded: 'rounded-box',
		square: ''
	};

	let sizes = {
		xs: 'text-xs w-8 h-8',
		sm: 'text-sm w-10 h-10',
		md: 'text-md w-12 h-12',
		lg: 'text-lg w-16 h-16'
	};

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('online' in $$props) $$invalidate(1, online = $$props.online);
		if ('offline' in $$props) $$invalidate(2, offline = $$props.offline);
		if ('shape' in $$props) $$invalidate(3, shape = $$props.shape);
		if ('label' in $$props) $$invalidate(4, label = $$props.label);
		if ('size' in $$props) $$invalidate(5, size = $$props.size);
		if ('image' in $$props) $$invalidate(6, image = $$props.image);
	};

	return [className, online, offline, shape, label, size, image, shapes, sizes];
}

class Avatar extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$t, create_fragment$u, safe_not_equal, {
			class: 0,
			online: 1,
			offline: 2,
			shape: 3,
			label: 4,
			size: 5,
			image: 6
		});
	}
}

/* src/avatar/AvatarGroup.svelte generated by Svelte v3.44.2 */

function create_fragment$t(ctx) {
	let div;
	let div_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", div_class_value = "-space-x-4 avatar-group " + /*className*/ ctx[0]);
			toggle_class(div, "-space-x-2", /*size*/ ctx[1] === 'xs');
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[2],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && div_class_value !== (div_class_value = "-space-x-4 avatar-group " + /*className*/ ctx[0])) {
				attr(div, "class", div_class_value);
			}

			if (dirty & /*className, size*/ 3) {
				toggle_class(div, "-space-x-2", /*size*/ ctx[1] === 'xs');
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$s($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { size = 'md' } = $$props;
	setContext('avatar:size', size);

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('size' in $$props) $$invalidate(1, size = $$props.size);
		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	return [className, size, $$scope, slots];
}

class AvatarGroup extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$s, create_fragment$t, safe_not_equal, { class: 0, size: 1 });
	}
}

/* src/badge/Badge.svelte generated by Svelte v3.44.2 */

function create_fragment$s(ctx) {
	let div;
	let div_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[5].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", div_class_value = "badge badge-" + /*size*/ ctx[1] + " badge-" + /*variant*/ ctx[2] + " " + /*className*/ ctx[0]);
			toggle_class(div, "badge-outline", /*outline*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[4],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*size, variant, className*/ 7 && div_class_value !== (div_class_value = "badge badge-" + /*size*/ ctx[1] + " badge-" + /*variant*/ ctx[2] + " " + /*className*/ ctx[0])) {
				attr(div, "class", div_class_value);
			}

			if (dirty & /*size, variant, className, outline*/ 15) {
				toggle_class(div, "badge-outline", /*outline*/ ctx[3]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$r($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { size = 'md' } = $$props;
	let { variant = 'primary' } = $$props;
	let { outline = false } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('size' in $$props) $$invalidate(1, size = $$props.size);
		if ('variant' in $$props) $$invalidate(2, variant = $$props.variant);
		if ('outline' in $$props) $$invalidate(3, outline = $$props.outline);
		if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
	};

	return [className, size, variant, outline, $$scope, slots];
}

class Badge extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$r, create_fragment$s, safe_not_equal, {
			class: 0,
			size: 1,
			variant: 2,
			outline: 3
		});
	}
}

/* src/breadcrumb/Breadcrumb.svelte generated by Svelte v3.44.2 */

function create_fragment$r(ctx) {
	let div;
	let ul;
	let div_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			div = element("div");
			ul = element("ul");
			if (default_slot) default_slot.c();
			attr(div, "class", div_class_value = "breadcrumbs " + /*className*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, ul);

			if (default_slot) {
				default_slot.m(ul, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && div_class_value !== (div_class_value = "breadcrumbs " + /*className*/ ctx[0])) {
				attr(div, "class", div_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$q($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [className, $$scope, slots];
}

class Breadcrumb extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$q, create_fragment$r, safe_not_equal, { class: 0 });
	}
}

/* src/breadcrumb/BreadcrumbItem.svelte generated by Svelte v3.44.2 */

const get_suffix_slot_changes$2 = dirty => ({});
const get_suffix_slot_context$2 = ctx => ({});
const get_prefix_slot_changes$2 = dirty => ({});
const get_prefix_slot_context$2 = ctx => ({});

function create_fragment$q(ctx) {
	let li;
	let t0;
	let div;
	let t1;
	let current;
	const prefix_slot_template = /*#slots*/ ctx[2].prefix;
	const prefix_slot = create_slot(prefix_slot_template, ctx, /*$$scope*/ ctx[1], get_prefix_slot_context$2);
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
	const suffix_slot_template = /*#slots*/ ctx[2].suffix;
	const suffix_slot = create_slot(suffix_slot_template, ctx, /*$$scope*/ ctx[1], get_suffix_slot_context$2);

	return {
		c() {
			li = element("li");
			if (prefix_slot) prefix_slot.c();
			t0 = space();
			div = element("div");
			if (default_slot) default_slot.c();
			t1 = space();
			if (suffix_slot) suffix_slot.c();
			attr(div, "class", "mx-2");
			toggle_class(li, "text-info", /*active*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, li, anchor);

			if (prefix_slot) {
				prefix_slot.m(li, null);
			}

			append(li, t0);
			append(li, div);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append(li, t1);

			if (suffix_slot) {
				suffix_slot.m(li, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (prefix_slot) {
				if (prefix_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						prefix_slot,
						prefix_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(prefix_slot_template, /*$$scope*/ ctx[1], dirty, get_prefix_slot_changes$2),
						get_prefix_slot_context$2
					);
				}
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
				}
			}

			if (suffix_slot) {
				if (suffix_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						suffix_slot,
						suffix_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(suffix_slot_template, /*$$scope*/ ctx[1], dirty, get_suffix_slot_changes$2),
						get_suffix_slot_context$2
					);
				}
			}

			if (dirty & /*active*/ 1) {
				toggle_class(li, "text-info", /*active*/ ctx[0]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(prefix_slot, local);
			transition_in(default_slot, local);
			transition_in(suffix_slot, local);
			current = true;
		},
		o(local) {
			transition_out(prefix_slot, local);
			transition_out(default_slot, local);
			transition_out(suffix_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			if (prefix_slot) prefix_slot.d(detaching);
			if (default_slot) default_slot.d(detaching);
			if (suffix_slot) suffix_slot.d(detaching);
		}
	};
}

function instance$p($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { active = false } = $$props;

	$$self.$$set = $$props => {
		if ('active' in $$props) $$invalidate(0, active = $$props.active);
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [active, $$scope, slots];
}

class BreadcrumbItem extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$p, create_fragment$q, safe_not_equal, { active: 0 });
	}
}

/* src/button/Button.svelte generated by Svelte v3.44.2 */
const get_suffix_slot_changes$1 = dirty => ({});
const get_suffix_slot_context$1 = ctx => ({});
const get_prefix_slot_changes$1 = dirty => ({});
const get_prefix_slot_context$1 = ctx => ({});

function create_fragment$p(ctx) {
	let button;
	let t0;
	let div;
	let t1;
	let button_class_value;
	let current;
	let mounted;
	let dispose;
	const prefix_slot_template = /*#slots*/ ctx[16].prefix;
	const prefix_slot = create_slot(prefix_slot_template, ctx, /*$$scope*/ ctx[15], get_prefix_slot_context$1);
	const default_slot_template = /*#slots*/ ctx[16].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);
	const suffix_slot_template = /*#slots*/ ctx[16].suffix;
	const suffix_slot = create_slot(suffix_slot_template, ctx, /*$$scope*/ ctx[15], get_suffix_slot_context$1);

	let button_levels = [
		/*$$restProps*/ ctx[14],
		{
			class: button_class_value = "btn btn-" + /*variant*/ ctx[2] + " btn-" + /*size*/ ctx[3] + " " + /*className*/ ctx[0]
		}
	];

	let button_data = {};

	for (let i = 0; i < button_levels.length; i += 1) {
		button_data = assign(button_data, button_levels[i]);
	}

	return {
		c() {
			button = element("button");
			if (prefix_slot) prefix_slot.c();
			t0 = space();
			div = element("div");
			if (default_slot) default_slot.c();
			t1 = space();
			if (suffix_slot) suffix_slot.c();
			attr(div, "class", "m-1");
			set_attributes(button, button_data);
			toggle_class(button, "btn-loading", /*loading*/ ctx[11]);
			toggle_class(button, "btn-circle", /*circle*/ ctx[6]);
			toggle_class(button, "btn-square", /*square*/ ctx[7]);
			toggle_class(button, "btn-outline", /*outline*/ ctx[1]);
			toggle_class(button, "no-animation", /*noAnimation*/ ctx[12]);
			toggle_class(button, "btn-active", /*active*/ ctx[8]);
			toggle_class(button, "btn-disabled", /*disabled*/ ctx[9]);
			toggle_class(button, "btn-wide", /*wide*/ ctx[4]);
			toggle_class(button, "btn-block", /*block*/ ctx[5]);
			toggle_class(button, "glass", /*glass*/ ctx[10]);
			toggle_class(button, "p-0", /*compact*/ ctx[13]);
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (prefix_slot) {
				prefix_slot.m(button, null);
			}

			append(button, t0);
			append(button, div);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append(button, t1);

			if (suffix_slot) {
				suffix_slot.m(button, null);
			}

			if (button.autofocus) button.focus();
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler*/ ctx[17]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (prefix_slot) {
				if (prefix_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
					update_slot_base(
						prefix_slot,
						prefix_slot_template,
						ctx,
						/*$$scope*/ ctx[15],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
						: get_slot_changes(prefix_slot_template, /*$$scope*/ ctx[15], dirty, get_prefix_slot_changes$1),
						get_prefix_slot_context$1
					);
				}
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[15],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null),
						null
					);
				}
			}

			if (suffix_slot) {
				if (suffix_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
					update_slot_base(
						suffix_slot,
						suffix_slot_template,
						ctx,
						/*$$scope*/ ctx[15],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
						: get_slot_changes(suffix_slot_template, /*$$scope*/ ctx[15], dirty, get_suffix_slot_changes$1),
						get_suffix_slot_context$1
					);
				}
			}

			set_attributes(button, button_data = get_spread_update(button_levels, [
				dirty & /*$$restProps*/ 16384 && /*$$restProps*/ ctx[14],
				(!current || dirty & /*variant, size, className*/ 13 && button_class_value !== (button_class_value = "btn btn-" + /*variant*/ ctx[2] + " btn-" + /*size*/ ctx[3] + " " + /*className*/ ctx[0])) && { class: button_class_value }
			]));

			toggle_class(button, "btn-loading", /*loading*/ ctx[11]);
			toggle_class(button, "btn-circle", /*circle*/ ctx[6]);
			toggle_class(button, "btn-square", /*square*/ ctx[7]);
			toggle_class(button, "btn-outline", /*outline*/ ctx[1]);
			toggle_class(button, "no-animation", /*noAnimation*/ ctx[12]);
			toggle_class(button, "btn-active", /*active*/ ctx[8]);
			toggle_class(button, "btn-disabled", /*disabled*/ ctx[9]);
			toggle_class(button, "btn-wide", /*wide*/ ctx[4]);
			toggle_class(button, "btn-block", /*block*/ ctx[5]);
			toggle_class(button, "glass", /*glass*/ ctx[10]);
			toggle_class(button, "p-0", /*compact*/ ctx[13]);
		},
		i(local) {
			if (current) return;
			transition_in(prefix_slot, local);
			transition_in(default_slot, local);
			transition_in(suffix_slot, local);
			current = true;
		},
		o(local) {
			transition_out(prefix_slot, local);
			transition_out(default_slot, local);
			transition_out(suffix_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			if (prefix_slot) prefix_slot.d(detaching);
			if (default_slot) default_slot.d(detaching);
			if (suffix_slot) suffix_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};
}

function instance$o($$self, $$props, $$invalidate) {
	const omit_props_names = [
		"class","outline","variant","size","wide","block","circle","square","active","disabled","glass","loading","noAnimation","compact"
	];

	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { outline = false } = $$props;
	let { variant = getContext('button:variant') ?? 'primary' } = $$props;
	let { size = getContext('button:size') ?? 'md' } = $$props;
	let { wide = false } = $$props;
	let { block = false } = $$props;
	let { circle = false } = $$props;
	let { square = false } = $$props;
	let { active = false } = $$props;
	let { disabled = false } = $$props;
	let { glass = false } = $$props;
	let { loading = false } = $$props;
	let { noAnimation = false } = $$props;
	let { compact = false } = $$props;

	function click_handler(event) {
		bubble.call(this, $$self, event);
	}

	$$self.$$set = $$new_props => {
		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
		$$invalidate(14, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('class' in $$new_props) $$invalidate(0, className = $$new_props.class);
		if ('outline' in $$new_props) $$invalidate(1, outline = $$new_props.outline);
		if ('variant' in $$new_props) $$invalidate(2, variant = $$new_props.variant);
		if ('size' in $$new_props) $$invalidate(3, size = $$new_props.size);
		if ('wide' in $$new_props) $$invalidate(4, wide = $$new_props.wide);
		if ('block' in $$new_props) $$invalidate(5, block = $$new_props.block);
		if ('circle' in $$new_props) $$invalidate(6, circle = $$new_props.circle);
		if ('square' in $$new_props) $$invalidate(7, square = $$new_props.square);
		if ('active' in $$new_props) $$invalidate(8, active = $$new_props.active);
		if ('disabled' in $$new_props) $$invalidate(9, disabled = $$new_props.disabled);
		if ('glass' in $$new_props) $$invalidate(10, glass = $$new_props.glass);
		if ('loading' in $$new_props) $$invalidate(11, loading = $$new_props.loading);
		if ('noAnimation' in $$new_props) $$invalidate(12, noAnimation = $$new_props.noAnimation);
		if ('compact' in $$new_props) $$invalidate(13, compact = $$new_props.compact);
		if ('$$scope' in $$new_props) $$invalidate(15, $$scope = $$new_props.$$scope);
	};

	return [
		className,
		outline,
		variant,
		size,
		wide,
		block,
		circle,
		square,
		active,
		disabled,
		glass,
		loading,
		noAnimation,
		compact,
		$$restProps,
		$$scope,
		slots,
		click_handler
	];
}

class Button extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$o, create_fragment$p, safe_not_equal, {
			class: 0,
			outline: 1,
			variant: 2,
			size: 3,
			wide: 4,
			block: 5,
			circle: 6,
			square: 7,
			active: 8,
			disabled: 9,
			glass: 10,
			loading: 11,
			noAnimation: 12,
			compact: 13
		});
	}
}

/* src/button/ButtonGroup.svelte generated by Svelte v3.44.2 */

function create_fragment$o(ctx) {
	let div;
	let div_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[4].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", div_class_value = "btn-group " + /*className*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && div_class_value !== (div_class_value = "btn-group " + /*className*/ ctx[0])) {
				attr(div, "class", div_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$n($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { size = "md" } = $$props;
	let { variant = 'primary' } = $$props;
	setContext('button:size', size);
	setContext('button:variant', variant);

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('size' in $$props) $$invalidate(1, size = $$props.size);
		if ('variant' in $$props) $$invalidate(2, variant = $$props.variant);
		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
	};

	return [className, size, variant, $$scope, slots];
}

class ButtonGroup extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$n, create_fragment$o, safe_not_equal, { class: 0, size: 1, variant: 2 });
	}
}

/* src/card/Card.svelte generated by Svelte v3.44.2 */

const get_image_slot_changes_1 = dirty => ({});
const get_image_slot_context_1 = ctx => ({});
const get_actions_slot_changes = dirty => ({});
const get_actions_slot_context = ctx => ({});
const get_title_slot_changes$3 = dirty => ({});
const get_title_slot_context$3 = ctx => ({});
const get_image_slot_changes = dirty => ({});
const get_image_slot_context = ctx => ({});

// (72:1) {#if position !== 'bottom'}
function create_if_block_1$1(ctx) {
	let current;
	const image_slot_template = /*#slots*/ ctx[9].image;
	const image_slot = create_slot(image_slot_template, ctx, /*$$scope*/ ctx[8], get_image_slot_context);

	return {
		c() {
			if (image_slot) image_slot.c();
		},
		m(target, anchor) {
			if (image_slot) {
				image_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (image_slot) {
				if (image_slot.p && (!current || dirty & /*$$scope*/ 256)) {
					update_slot_base(
						image_slot,
						image_slot_template,
						ctx,
						/*$$scope*/ ctx[8],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
						: get_slot_changes(image_slot_template, /*$$scope*/ ctx[8], dirty, get_image_slot_changes),
						get_image_slot_context
					);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(image_slot, local);
			current = true;
		},
		o(local) {
			transition_out(image_slot, local);
			current = false;
		},
		d(detaching) {
			if (image_slot) image_slot.d(detaching);
		}
	};
}

// (84:1) {#if position === 'bottom'}
function create_if_block$3(ctx) {
	let current;
	const image_slot_template = /*#slots*/ ctx[9].image;
	const image_slot = create_slot(image_slot_template, ctx, /*$$scope*/ ctx[8], get_image_slot_context_1);

	return {
		c() {
			if (image_slot) image_slot.c();
		},
		m(target, anchor) {
			if (image_slot) {
				image_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (image_slot) {
				if (image_slot.p && (!current || dirty & /*$$scope*/ 256)) {
					update_slot_base(
						image_slot,
						image_slot_template,
						ctx,
						/*$$scope*/ ctx[8],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
						: get_slot_changes(image_slot_template, /*$$scope*/ ctx[8], dirty, get_image_slot_changes_1),
						get_image_slot_context_1
					);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(image_slot, local);
			current = true;
		},
		o(local) {
			transition_out(image_slot, local);
			current = false;
		},
		d(detaching) {
			if (image_slot) image_slot.d(detaching);
		}
	};
}

function create_fragment$n(ctx) {
	let div2;
	let t0;
	let div1;
	let t1;
	let div0;
	let t2;
	let t3;
	let div2_class_value;
	let current;
	let if_block0 = /*position*/ ctx[5] !== 'bottom' && create_if_block_1$1(ctx);
	const title_slot_template = /*#slots*/ ctx[9].title;
	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[8], get_title_slot_context$3);
	const default_slot_template = /*#slots*/ ctx[9].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);
	const actions_slot_template = /*#slots*/ ctx[9].actions;
	const actions_slot = create_slot(actions_slot_template, ctx, /*$$scope*/ ctx[8], get_actions_slot_context);
	let if_block1 = /*position*/ ctx[5] === 'bottom' && create_if_block$3(ctx);

	return {
		c() {
			div2 = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			div1 = element("div");
			if (title_slot) title_slot.c();
			t1 = space();
			div0 = element("div");
			if (default_slot) default_slot.c();
			t2 = space();
			if (actions_slot) actions_slot.c();
			t3 = space();
			if (if_block1) if_block1.c();
			attr(div0, "class", "flex-1");
			attr(div1, "class", "card-body");

			attr(div2, "class", div2_class_value = "card " + /*shadows*/ ctx[7][/*shadow*/ ctx[0]] + " " + (/*bordered*/ ctx[3]
			? 'border border-gray-500 border-opacity-20'
			: '') + " " + /*className*/ ctx[2]);

			toggle_class(div2, "image-full", /*full*/ ctx[6]);
			toggle_class(div2, "card-side", /*side*/ ctx[1]);
			toggle_class(div2, "compact", /*compact*/ ctx[4]);
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			if (if_block0) if_block0.m(div2, null);
			append(div2, t0);
			append(div2, div1);

			if (title_slot) {
				title_slot.m(div1, null);
			}

			append(div1, t1);
			append(div1, div0);

			if (default_slot) {
				default_slot.m(div0, null);
			}

			append(div1, t2);

			if (actions_slot) {
				actions_slot.m(div1, null);
			}

			append(div2, t3);
			if (if_block1) if_block1.m(div2, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*position*/ ctx[5] !== 'bottom') {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*position*/ 32) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_1$1(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div2, t0);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (title_slot) {
				if (title_slot.p && (!current || dirty & /*$$scope*/ 256)) {
					update_slot_base(
						title_slot,
						title_slot_template,
						ctx,
						/*$$scope*/ ctx[8],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
						: get_slot_changes(title_slot_template, /*$$scope*/ ctx[8], dirty, get_title_slot_changes$3),
						get_title_slot_context$3
					);
				}
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[8],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, null),
						null
					);
				}
			}

			if (actions_slot) {
				if (actions_slot.p && (!current || dirty & /*$$scope*/ 256)) {
					update_slot_base(
						actions_slot,
						actions_slot_template,
						ctx,
						/*$$scope*/ ctx[8],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
						: get_slot_changes(actions_slot_template, /*$$scope*/ ctx[8], dirty, get_actions_slot_changes),
						get_actions_slot_context
					);
				}
			}

			if (/*position*/ ctx[5] === 'bottom') {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty & /*position*/ 32) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block$3(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div2, null);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (!current || dirty & /*shadow, bordered, className*/ 13 && div2_class_value !== (div2_class_value = "card " + /*shadows*/ ctx[7][/*shadow*/ ctx[0]] + " " + (/*bordered*/ ctx[3]
			? 'border border-gray-500 border-opacity-20'
			: '') + " " + /*className*/ ctx[2])) {
				attr(div2, "class", div2_class_value);
			}

			if (dirty & /*shadow, bordered, className, full*/ 77) {
				toggle_class(div2, "image-full", /*full*/ ctx[6]);
			}

			if (dirty & /*shadow, bordered, className, side*/ 15) {
				toggle_class(div2, "card-side", /*side*/ ctx[1]);
			}

			if (dirty & /*shadow, bordered, className, compact*/ 29) {
				toggle_class(div2, "compact", /*compact*/ ctx[4]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(title_slot, local);
			transition_in(default_slot, local);
			transition_in(actions_slot, local);
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(title_slot, local);
			transition_out(default_slot, local);
			transition_out(actions_slot, local);
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div2);
			if (if_block0) if_block0.d();
			if (title_slot) title_slot.d(detaching);
			if (default_slot) default_slot.d(detaching);
			if (actions_slot) actions_slot.d(detaching);
			if (if_block1) if_block1.d();
		}
	};
}

function instance$m($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { side = false } = $$props;
	let full = false;
	let { bordered = true } = $$props;
	let { compact = false } = $$props;
	let { position = 'top' } = $$props;
	let { shadow = false } = $$props;

	const shadows = {
		none: '',
		xs: 'shadow-sm',
		sm: 'shadow-md',
		md: 'shadow-lg',
		lg: 'shadow-xl'
	};

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(2, className = $$props.class);
		if ('side' in $$props) $$invalidate(1, side = $$props.side);
		if ('bordered' in $$props) $$invalidate(3, bordered = $$props.bordered);
		if ('compact' in $$props) $$invalidate(4, compact = $$props.compact);
		if ('position' in $$props) $$invalidate(5, position = $$props.position);
		if ('shadow' in $$props) $$invalidate(0, shadow = $$props.shadow);
		if ('$$scope' in $$props) $$invalidate(8, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*position*/ 32) {
			// image-full and card-side classes are based on position prop
			{
				if (position === 'side') {
					$$invalidate(1, side = true);
					$$invalidate(6, full = false);
				} else if (position === 'full') {
					$$invalidate(1, side = false);
					$$invalidate(6, full = true);
				} else {
					$$invalidate(1, side = false);
					$$invalidate(6, full = false);
				}
			}
		}

		if ($$self.$$.dirty & /*shadow*/ 1) {
			{
				if (shadow === true) {
					$$invalidate(0, shadow = 'sm');
				} else if (shadow === false) {
					$$invalidate(0, shadow = 'none');
				}
			}
		}

		if ($$self.$$.dirty & /*shadow*/ 1) {
			console.log(shadow);
		}
	};

	return [
		shadow,
		side,
		className,
		bordered,
		compact,
		position,
		full,
		shadows,
		$$scope,
		slots
	];
}

class Card extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$m, create_fragment$n, safe_not_equal, {
			class: 2,
			side: 1,
			bordered: 3,
			compact: 4,
			position: 5,
			shadow: 0
		});
	}
}

/* src/card/CardTitle.svelte generated by Svelte v3.44.2 */

function create_fragment$m(ctx) {
	let h2;
	let h2_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

	return {
		c() {
			h2 = element("h2");
			if (default_slot) default_slot.c();
			attr(h2, "class", h2_class_value = "card-title text-3xl " + /*className*/ ctx[0]);
			toggle_class(h2, "text-center", /*center*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, h2, anchor);

			if (default_slot) {
				default_slot.m(h2, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[2],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && h2_class_value !== (h2_class_value = "card-title text-3xl " + /*className*/ ctx[0])) {
				attr(h2, "class", h2_class_value);
			}

			if (dirty & /*className, center*/ 3) {
				toggle_class(h2, "text-center", /*center*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h2);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$l($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { center = false } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('center' in $$props) $$invalidate(1, center = $$props.center);
		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	return [className, center, $$scope, slots];
}

class CardTitle extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$l, create_fragment$m, safe_not_equal, { class: 0, center: 1 });
	}
}

/* src/card/CardActions.svelte generated by Svelte v3.44.2 */

function create_fragment$l(ctx) {
	let div;
	let div_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[4].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", div_class_value = "card-actions items-center " + /*positions*/ ctx[2][/*position*/ ctx[1]] + " " + /*className*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*position, className*/ 3 && div_class_value !== (div_class_value = "card-actions items-center " + /*positions*/ ctx[2][/*position*/ ctx[1]] + " " + /*className*/ ctx[0])) {
				attr(div, "class", div_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$k($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { position = 'end' } = $$props;

	let positions = {
		start: 'justify-start',
		center: 'justify-center',
		end: 'justify-end'
	};

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('position' in $$props) $$invalidate(1, position = $$props.position);
		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
	};

	return [className, position, positions, $$scope, slots];
}

class CardActions extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$k, create_fragment$l, safe_not_equal, { class: 0, position: 1 });
	}
}

/* src/carousel/Carousel.svelte generated by Svelte v3.44.2 */

function create_fragment$k(ctx) {
	let div;
	let div_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[5].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", div_class_value = "carousel " + /*className*/ ctx[0]);
			toggle_class(div, "carousel-center", /*center*/ ctx[2]);
			toggle_class(div, "carousel-end", /*end*/ ctx[3]);
			toggle_class(div, "carousel-vertical", /*vertical*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[4],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && div_class_value !== (div_class_value = "carousel " + /*className*/ ctx[0])) {
				attr(div, "class", div_class_value);
			}

			if (dirty & /*className, center*/ 5) {
				toggle_class(div, "carousel-center", /*center*/ ctx[2]);
			}

			if (dirty & /*className, end*/ 9) {
				toggle_class(div, "carousel-end", /*end*/ ctx[3]);
			}

			if (dirty & /*className, vertical*/ 3) {
				toggle_class(div, "carousel-vertical", /*vertical*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$j($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { vertical = false } = $$props;
	let { center = false } = $$props;
	let { end = false } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('vertical' in $$props) $$invalidate(1, vertical = $$props.vertical);
		if ('center' in $$props) $$invalidate(2, center = $$props.center);
		if ('end' in $$props) $$invalidate(3, end = $$props.end);
		if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
	};

	return [className, vertical, center, end, $$scope, slots];
}

class Carousel extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$j, create_fragment$k, safe_not_equal, { class: 0, vertical: 1, center: 2, end: 3 });
	}
}

/* src/carousel/CarouselItem.svelte generated by Svelte v3.44.2 */

function create_fragment$j(ctx) {
	let div;
	let div_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", div_class_value = "carousel-item " + /*className*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && div_class_value !== (div_class_value = "carousel-item " + /*className*/ ctx[0])) {
				attr(div, "class", div_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$i($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [className, $$scope, slots];
}

class CarouselItem extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$i, create_fragment$j, safe_not_equal, { class: 0 });
	}
}

/* src/drawer/Drawer.svelte generated by Svelte v3.44.2 */

const get_title_slot_changes$2 = dirty => ({});
const get_title_slot_context$2 = ctx => ({});

// (57:0) {#if show}
function create_if_block$2(ctx) {
	let div;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			attr(div, "class", "fixed w-screen h-screen top-0 left-0 z-50 bg-black opacity-0 transition-opacity duration-300");
			toggle_class(div, "opacity-50", /*show*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (!mounted) {
				dispose = listen(div, "click", /*close*/ ctx[2]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*show*/ 1) {
				toggle_class(div, "opacity-50", /*show*/ ctx[0]);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

// (66:22) Title
function fallback_block(ctx) {
	let t;

	return {
		c() {
			t = text("Title");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment$i(ctx) {
	let t0;
	let div2;
	let div1;
	let span;
	let t1;
	let div0;
	let t3;
	let current;
	let mounted;
	let dispose;
	let if_block = /*show*/ ctx[0] && create_if_block$2(ctx);
	const title_slot_template = /*#slots*/ ctx[6].title;
	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[5], get_title_slot_context$2);
	const title_slot_or_fallback = title_slot || fallback_block();
	const default_slot_template = /*#slots*/ ctx[6].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

	return {
		c() {
			if (if_block) if_block.c();
			t0 = space();
			div2 = element("div");
			div1 = element("div");
			span = element("span");
			if (title_slot_or_fallback) title_slot_or_fallback.c();
			t1 = space();
			div0 = element("div");
			div0.textContent = "×";
			t3 = space();
			if (default_slot) default_slot.c();
			attr(span, "class", "p-2 text-xl font-semibold");
			attr(div0, "class", "text-2xl m-4 mt-3");
			attr(div1, "class", "flex flex-row justify-between items-center mb-4");
			attr(div2, "class", /*classes*/ ctx[1]);
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, t0, anchor);
			insert(target, div2, anchor);
			append(div2, div1);
			append(div1, span);

			if (title_slot_or_fallback) {
				title_slot_or_fallback.m(span, null);
			}

			append(div1, t1);
			append(div1, div0);
			append(div2, t3);

			if (default_slot) {
				default_slot.m(div2, null);
			}

			current = true;

			if (!mounted) {
				dispose = listen(div0, "click", /*close*/ ctx[2]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (/*show*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$2(ctx);
					if_block.c();
					if_block.m(t0.parentNode, t0);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (title_slot) {
				if (title_slot.p && (!current || dirty & /*$$scope*/ 32)) {
					update_slot_base(
						title_slot,
						title_slot_template,
						ctx,
						/*$$scope*/ ctx[5],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
						: get_slot_changes(title_slot_template, /*$$scope*/ ctx[5], dirty, get_title_slot_changes$2),
						get_title_slot_context$2
					);
				}
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[5],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*classes*/ 2) {
				attr(div2, "class", /*classes*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(title_slot_or_fallback, local);
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(title_slot_or_fallback, local);
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(t0);
			if (detaching) detach(div2);
			if (title_slot_or_fallback) title_slot_or_fallback.d(detaching);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};
}

function instance$h($$self, $$props, $$invalidate) {
	let classes;
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	const close = () => $$invalidate(0, show = false);
	let { show = false } = $$props;
	let { position = 'left' } = $$props;

	// temporary solution
	let positions = {
		left: 'border-r top-0 w-[400px] h-screen',
		right: 'border-l right-0 top-0 w-[400px] h-screen',
		top: 'h-[30vh] border-b left-0 right-0 top-0 -translate-y-full',
		bottom: 'h-[30vh] border-t bottom-0 left-0 right-0 '
	};

	let showPositions = {
		left: 'left-0',
		top: 'translate-y-0',
		right: 'translate-none',
		bottom: 'translate-none'
	};

	let hidePositions = {
		left: 'left-0 -translate-x-full',
		top: 'top-0',
		right: 'translate-x-full',
		bottom: 'bottom-0 translate-y-full'
	};

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(3, className = $$props.class);
		if ('show' in $$props) $$invalidate(0, show = $$props.show);
		if ('position' in $$props) $$invalidate(4, position = $$props.position);
		if ('$$scope' in $$props) $$invalidate(5, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*position, show, className*/ 25) {
			$$invalidate(1, classes = [
				'fixed',
				'flex',
				'flex-col',
				'p-2',
				'transition-transform',
				'duration-300',
				'border-gray-500',
				'bg-white',
				'z-[60]',
				positions[position],
				show ? showPositions[position] : hidePositions[position],
				className
			].join(' '));
		}
	};

	return [show, classes, close, className, position, $$scope, slots];
}

class Drawer extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$h, create_fragment$i, safe_not_equal, { class: 3, show: 0, position: 4 });
	}
}

/* src/menu/Menu.svelte generated by Svelte v3.44.2 */

function create_fragment$h(ctx) {
	let ul;
	let ul_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[5].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	return {
		c() {
			ul = element("ul");
			if (default_slot) default_slot.c();
			attr(ul, "class", ul_class_value = "menu bg-base-100 text-base-content shadow " + /*className*/ ctx[0]);
			toggle_class(ul, "rounded-box", /*rounded*/ ctx[2]);
			toggle_class(ul, "horizontal", /*horizontal*/ ctx[3]);
			toggle_class(ul, "menu-compact", /*compact*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, ul, anchor);

			if (default_slot) {
				default_slot.m(ul, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[4],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && ul_class_value !== (ul_class_value = "menu bg-base-100 text-base-content shadow " + /*className*/ ctx[0])) {
				attr(ul, "class", ul_class_value);
			}

			if (dirty & /*className, rounded*/ 5) {
				toggle_class(ul, "rounded-box", /*rounded*/ ctx[2]);
			}

			if (dirty & /*className, horizontal*/ 9) {
				toggle_class(ul, "horizontal", /*horizontal*/ ctx[3]);
			}

			if (dirty & /*className, compact*/ 3) {
				toggle_class(ul, "menu-compact", /*compact*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(ul);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$g($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { compact = false } = $$props;
	let { rounded = false } = $$props;
	let { horizontal = false } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('compact' in $$props) $$invalidate(1, compact = $$props.compact);
		if ('rounded' in $$props) $$invalidate(2, rounded = $$props.rounded);
		if ('horizontal' in $$props) $$invalidate(3, horizontal = $$props.horizontal);
		if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
	};

	return [className, compact, rounded, horizontal, $$scope, slots];
}

class Menu extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$g, create_fragment$h, safe_not_equal, {
			class: 0,
			compact: 1,
			rounded: 2,
			horizontal: 3
		});
	}
}

/* src/menu/MenuItem.svelte generated by Svelte v3.44.2 */

const get_suffix_slot_changes = dirty => ({});
const get_suffix_slot_context = ctx => ({});
const get_prefix_slot_changes = dirty => ({});
const get_prefix_slot_context = ctx => ({});

function create_fragment$g(ctx) {
	let li;
	let a;
	let t0;
	let div;
	let t1;
	let li_class_value;
	let current;
	const prefix_slot_template = /*#slots*/ ctx[4].prefix;
	const prefix_slot = create_slot(prefix_slot_template, ctx, /*$$scope*/ ctx[3], get_prefix_slot_context);
	const default_slot_template = /*#slots*/ ctx[4].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
	const suffix_slot_template = /*#slots*/ ctx[4].suffix;
	const suffix_slot = create_slot(suffix_slot_template, ctx, /*$$scope*/ ctx[3], get_suffix_slot_context);

	return {
		c() {
			li = element("li");
			a = element("a");
			if (prefix_slot) prefix_slot.c();
			t0 = space();
			div = element("div");
			if (default_slot) default_slot.c();
			t1 = space();
			if (suffix_slot) suffix_slot.c();
			attr(div, "class", "w-full");
			attr(a, "class", "flex gap-2 w-full");
			attr(a, "href", /*href*/ ctx[1]);
			attr(li, "class", li_class_value = "w-full " + /*className*/ ctx[0]);
			toggle_class(li, "bordered", /*bordered*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, a);

			if (prefix_slot) {
				prefix_slot.m(a, null);
			}

			append(a, t0);
			append(a, div);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append(a, t1);

			if (suffix_slot) {
				suffix_slot.m(a, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (prefix_slot) {
				if (prefix_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						prefix_slot,
						prefix_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(prefix_slot_template, /*$$scope*/ ctx[3], dirty, get_prefix_slot_changes),
						get_prefix_slot_context
					);
				}
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
						null
					);
				}
			}

			if (suffix_slot) {
				if (suffix_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						suffix_slot,
						suffix_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(suffix_slot_template, /*$$scope*/ ctx[3], dirty, get_suffix_slot_changes),
						get_suffix_slot_context
					);
				}
			}

			if (!current || dirty & /*href*/ 2) {
				attr(a, "href", /*href*/ ctx[1]);
			}

			if (!current || dirty & /*className*/ 1 && li_class_value !== (li_class_value = "w-full " + /*className*/ ctx[0])) {
				attr(li, "class", li_class_value);
			}

			if (dirty & /*className, bordered*/ 5) {
				toggle_class(li, "bordered", /*bordered*/ ctx[2]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(prefix_slot, local);
			transition_in(default_slot, local);
			transition_in(suffix_slot, local);
			current = true;
		},
		o(local) {
			transition_out(prefix_slot, local);
			transition_out(default_slot, local);
			transition_out(suffix_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			if (prefix_slot) prefix_slot.d(detaching);
			if (default_slot) default_slot.d(detaching);
			if (suffix_slot) suffix_slot.d(detaching);
		}
	};
}

function instance$f($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { href = undefined } = $$props;
	let { bordered = false } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('href' in $$props) $$invalidate(1, href = $$props.href);
		if ('bordered' in $$props) $$invalidate(2, bordered = $$props.bordered);
		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
	};

	return [className, href, bordered, $$scope, slots];
}

class MenuItem extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$f, create_fragment$g, safe_not_equal, { class: 0, href: 1, bordered: 2 });
	}
}

/* src/menu/MenuTitle.svelte generated by Svelte v3.44.2 */

function create_fragment$f(ctx) {
	let li;
	let span;
	let li_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			li = element("li");
			span = element("span");
			if (default_slot) default_slot.c();
			attr(li, "class", li_class_value = "menu-title " + /*className*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, span);

			if (default_slot) {
				default_slot.m(span, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && li_class_value !== (li_class_value = "menu-title " + /*className*/ ctx[0])) {
				attr(li, "class", li_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$e($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [className, $$scope, slots];
}

class MenuTitle extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$e, create_fragment$f, safe_not_equal, { class: 0 });
	}
}

/* src/countdown/Countdown.svelte generated by Svelte v3.44.2 */

function create_fragment$e(ctx) {
	let div;
	let span;
	let div_class_value;

	return {
		c() {
			div = element("div");
			span = element("span");
			set_style(span, "--value", /*value*/ ctx[1]);
			attr(div, "class", div_class_value = "countdown " + /*className*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span);
		},
		p(ctx, [dirty]) {
			if (dirty & /*value*/ 2) {
				set_style(span, "--value", /*value*/ ctx[1]);
			}

			if (dirty & /*className*/ 1 && div_class_value !== (div_class_value = "countdown " + /*className*/ ctx[0])) {
				attr(div, "class", div_class_value);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let { class: className = '' } = $$props;
	let { value = 0 } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('value' in $$props) $$invalidate(1, value = $$props.value);
	};

	return [className, value];
}

class Countdown extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$d, create_fragment$e, safe_not_equal, { class: 0, value: 1 });
	}
}

/* src/divider/Divider.svelte generated by Svelte v3.44.2 */

function create_fragment$d(ctx) {
	let div;
	let div_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", div_class_value = "divider " + /*className*/ ctx[0]);
			toggle_class(div, "divider-vertical", /*vertical*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[2],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && div_class_value !== (div_class_value = "divider " + /*className*/ ctx[0])) {
				attr(div, "class", div_class_value);
			}

			if (dirty & /*className, vertical*/ 3) {
				toggle_class(div, "divider-vertical", /*vertical*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$c($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { vertical = false } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('vertical' in $$props) $$invalidate(1, vertical = $$props.vertical);
		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	return [className, vertical, $$scope, slots];
}

class Divider extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$c, create_fragment$d, safe_not_equal, { class: 0, vertical: 1 });
	}
}

/* src/dropdown/Dropdown.svelte generated by Svelte v3.44.2 */

const get_title_slot_changes$1 = dirty => ({});
const get_title_slot_context$1 = ctx => ({});

function create_fragment$c(ctx) {
	let div2;
	let div0;
	let t;
	let div1;
	let div2_class_value;
	let current;
	const title_slot_template = /*#slots*/ ctx[6].title;
	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[5], get_title_slot_context$1);
	const default_slot_template = /*#slots*/ ctx[6].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

	return {
		c() {
			div2 = element("div");
			div0 = element("div");
			if (title_slot) title_slot.c();
			t = space();
			div1 = element("div");
			if (default_slot) default_slot.c();
			attr(div0, "tabindex", "0");
			attr(div0, "class", "m-1 btn");
			attr(div1, "tabindex", "0");
			attr(div1, "class", "w-max dropdown-content");
			attr(div2, "class", div2_class_value = "dropdown dropdown-" + /*position*/ ctx[1] + " " + /*className*/ ctx[0]);
			toggle_class(div2, "dropdown-end", /*end*/ ctx[2]);
			toggle_class(div2, "dropdown-open", /*open*/ ctx[3]);
			toggle_class(div2, "dropdown-hover", /*hover*/ ctx[4]);
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);

			if (title_slot) {
				title_slot.m(div0, null);
			}

			append(div2, t);
			append(div2, div1);

			if (default_slot) {
				default_slot.m(div1, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (title_slot) {
				if (title_slot.p && (!current || dirty & /*$$scope*/ 32)) {
					update_slot_base(
						title_slot,
						title_slot_template,
						ctx,
						/*$$scope*/ ctx[5],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
						: get_slot_changes(title_slot_template, /*$$scope*/ ctx[5], dirty, get_title_slot_changes$1),
						get_title_slot_context$1
					);
				}
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[5],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*position, className*/ 3 && div2_class_value !== (div2_class_value = "dropdown dropdown-" + /*position*/ ctx[1] + " " + /*className*/ ctx[0])) {
				attr(div2, "class", div2_class_value);
			}

			if (dirty & /*position, className, end*/ 7) {
				toggle_class(div2, "dropdown-end", /*end*/ ctx[2]);
			}

			if (dirty & /*position, className, open*/ 11) {
				toggle_class(div2, "dropdown-open", /*open*/ ctx[3]);
			}

			if (dirty & /*position, className, hover*/ 19) {
				toggle_class(div2, "dropdown-hover", /*hover*/ ctx[4]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(title_slot, local);
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(title_slot, local);
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div2);
			if (title_slot) title_slot.d(detaching);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { position = 'bottom' } = $$props;
	let { end = false } = $$props;
	let { open = false } = $$props;
	let { hover = false } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('position' in $$props) $$invalidate(1, position = $$props.position);
		if ('end' in $$props) $$invalidate(2, end = $$props.end);
		if ('open' in $$props) $$invalidate(3, open = $$props.open);
		if ('hover' in $$props) $$invalidate(4, hover = $$props.hover);
		if ('$$scope' in $$props) $$invalidate(5, $$scope = $$props.$$scope);
	};

	return [className, position, end, open, hover, $$scope, slots];
}

class Dropdown extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$b, create_fragment$c, safe_not_equal, {
			class: 0,
			position: 1,
			end: 2,
			open: 3,
			hover: 4
		});
	}
}

/* src/link/Link.svelte generated by Svelte v3.44.2 */

function create_fragment$b(ctx) {
	let a;
	let a_class_value;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[5].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	return {
		c() {
			a = element("a");
			if (default_slot) default_slot.c();
			attr(a, "href", /*href*/ ctx[1]);
			attr(a, "class", a_class_value = "link link-" + /*variant*/ ctx[3] + " " + /*className*/ ctx[0]);
			toggle_class(a, "link-hover", /*hover*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, a, anchor);

			if (default_slot) {
				default_slot.m(a, null);
			}

			current = true;

			if (!mounted) {
				dispose = listen(a, "click", /*click_handler*/ ctx[6]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[4],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*href*/ 2) {
				attr(a, "href", /*href*/ ctx[1]);
			}

			if (!current || dirty & /*variant, className*/ 9 && a_class_value !== (a_class_value = "link link-" + /*variant*/ ctx[3] + " " + /*className*/ ctx[0])) {
				attr(a, "class", a_class_value);
			}

			if (dirty & /*variant, className, hover*/ 13) {
				toggle_class(a, "link-hover", /*hover*/ ctx[2]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(a);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { href = undefined } = $$props;
	let { hover = false } = $$props;
	let { variant = 'primary' } = $$props;

	function click_handler(event) {
		bubble.call(this, $$self, event);
	}

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('href' in $$props) $$invalidate(1, href = $$props.href);
		if ('hover' in $$props) $$invalidate(2, hover = $$props.hover);
		if ('variant' in $$props) $$invalidate(3, variant = $$props.variant);
		if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
	};

	return [className, href, hover, variant, $$scope, slots, click_handler];
}

class Link extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$a, create_fragment$b, safe_not_equal, { class: 0, href: 1, hover: 2, variant: 3 });
	}
}

/* src/image/Image.svelte generated by Svelte v3.44.2 */

function create_fragment$a(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			attr(img, "class", /*classes*/ ctx[2]);
			if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) attr(img, "src", img_src_value);
			attr(img, "alt", /*alt*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, img, anchor);
		},
		p(ctx, [dirty]) {
			if (dirty & /*classes*/ 4) {
				attr(img, "class", /*classes*/ ctx[2]);
			}

			if (dirty & /*src*/ 1 && !src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) {
				attr(img, "src", img_src_value);
			}

			if (dirty & /*alt*/ 2) {
				attr(img, "alt", /*alt*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(img);
		}
	};
}

function instance$9($$self, $$props, $$invalidate) {
	let classes;
	let { class: className = '' } = $$props;
	let { src } = $$props;
	let { alt } = $$props;
	let { rounded = false } = $$props;
	let { shadow = false } = $$props;
	let { bordered = false } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(3, className = $$props.class);
		if ('src' in $$props) $$invalidate(0, src = $$props.src);
		if ('alt' in $$props) $$invalidate(1, alt = $$props.alt);
		if ('rounded' in $$props) $$invalidate(4, rounded = $$props.rounded);
		if ('shadow' in $$props) $$invalidate(5, shadow = $$props.shadow);
		if ('bordered' in $$props) $$invalidate(6, bordered = $$props.bordered);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*rounded, shadow, bordered, className*/ 120) {
			$$invalidate(2, classes = [
				rounded && rounded === 'full'
				? 'rounded-full'
				: rounded ? 'rounded-box' : '',
				shadow ? 'shadow-lg' : '',
				bordered ? 'border border-base-300' : '',
				className
			].join(' '));
		}
	};

	return [src, alt, classes, className, rounded, shadow, bordered];
}

class Image extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$9, create_fragment$a, safe_not_equal, {
			class: 3,
			src: 0,
			alt: 1,
			rounded: 4,
			shadow: 5,
			bordered: 6
		});
	}
}

/* src/modal/Modal.svelte generated by Svelte v3.44.2 */

function create_if_block$1(ctx) {
	let div0;
	let div0_class_value;
	let div0_transition;
	let t;
	let div2;
	let div1;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[5].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	return {
		c() {
			div0 = element("div");
			t = space();
			div2 = element("div");
			div1 = element("div");
			if (default_slot) default_slot.c();
			attr(div0, "class", div0_class_value = "fixed w-full h-full z-30 left-0 top-0 bg-black bg-opacity-40 transition-all flex items-center justify-center " + /*className*/ ctx[1] + "");
			attr(div1, "class", "z-[100] w-10/12 sm:w-8/12 md:w-6/12 lg:w-4/12 bg-base-300 p-4 text-base-content rounded-lg shadow-2xl");
			attr(div2, "class", "fixed w-full h-full items-center justify-center top-0 left-0 flex z-50");
			toggle_class(div2, "text-center", /*center*/ ctx[2]);
			toggle_class(div2, "text-right", /*end*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			insert(target, t, anchor);
			insert(target, div2, anchor);
			append(div2, div1);

			if (default_slot) {
				default_slot.m(div1, null);
			}

			current = true;

			if (!mounted) {
				dispose = listen(div0, "click", /*click_handler*/ ctx[6]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (!current || dirty & /*className*/ 2 && div0_class_value !== (div0_class_value = "fixed w-full h-full z-30 left-0 top-0 bg-black bg-opacity-40 transition-all flex items-center justify-center " + /*className*/ ctx[1] + "")) {
				attr(div0, "class", div0_class_value);
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[4],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
						null
					);
				}
			}

			if (dirty & /*center*/ 4) {
				toggle_class(div2, "text-center", /*center*/ ctx[2]);
			}

			if (dirty & /*end*/ 8) {
				toggle_class(div2, "text-right", /*end*/ ctx[3]);
			}
		},
		i(local) {
			if (current) return;

			add_render_callback(() => {
				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 100 }, true);
				div0_transition.run(1);
			});

			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 100 }, false);
			div0_transition.run(0);
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div0);
			if (detaching && div0_transition) div0_transition.end();
			if (detaching) detach(t);
			if (detaching) detach(div2);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$9(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*open*/ ctx[0] && create_if_block$1(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*open*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*open*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance$8($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { open = false } = $$props;
	let { center = false } = $$props;
	let { end = false } = $$props;
	const click_handler = () => $$invalidate(0, open = false);

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(1, className = $$props.class);
		if ('open' in $$props) $$invalidate(0, open = $$props.open);
		if ('center' in $$props) $$invalidate(2, center = $$props.center);
		if ('end' in $$props) $$invalidate(3, end = $$props.end);
		if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
	};

	return [open, className, center, end, $$scope, slots, click_handler];
}

class Modal extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$8, create_fragment$9, safe_not_equal, { class: 1, open: 0, center: 2, end: 3 });
	}
}

/* src/modal/ModalActions.svelte generated by Svelte v3.44.2 */

function create_fragment$8(ctx) {
	let div;
	let div_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[5].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", div_class_value = "mt-2 flex flex-row items-center space-x-2 " + /*className*/ ctx[0]);
			toggle_class(div, "justify-start", /*start*/ ctx[3]);
			toggle_class(div, "justify-end", /*end*/ ctx[2]);
			toggle_class(div, "justify-center", /*center*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[4],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && div_class_value !== (div_class_value = "mt-2 flex flex-row items-center space-x-2 " + /*className*/ ctx[0])) {
				attr(div, "class", div_class_value);
			}

			if (dirty & /*className, start*/ 9) {
				toggle_class(div, "justify-start", /*start*/ ctx[3]);
			}

			if (dirty & /*className, end*/ 5) {
				toggle_class(div, "justify-end", /*end*/ ctx[2]);
			}

			if (dirty & /*className, center*/ 3) {
				toggle_class(div, "justify-center", /*center*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { center = false } = $$props;
	let { end = false } = $$props;
	let { start = true } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('center' in $$props) $$invalidate(1, center = $$props.center);
		if ('end' in $$props) $$invalidate(2, end = $$props.end);
		if ('start' in $$props) $$invalidate(3, start = $$props.start);
		if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
	};

	return [className, center, end, start, $$scope, slots];
}

class ModalActions extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$7, create_fragment$8, safe_not_equal, { class: 0, center: 1, end: 2, start: 3 });
	}
}

/* src/navbar/Navbar.svelte generated by Svelte v3.44.2 */

const get_end_slot_changes = dirty => ({});
const get_end_slot_context = ctx => ({});
const get_center_slot_changes = dirty => ({});
const get_center_slot_context = ctx => ({});
const get_start_slot_changes = dirty => ({});
const get_start_slot_context = ctx => ({});

function create_fragment$7(ctx) {
	let nav;
	let div0;
	let t0;
	let div1;
	let t1;
	let div2;
	let nav_class_value;
	let current;
	const start_slot_template = /*#slots*/ ctx[9].start;
	const start_slot = create_slot(start_slot_template, ctx, /*$$scope*/ ctx[8], get_start_slot_context);
	const center_slot_template = /*#slots*/ ctx[9].center;
	const center_slot = create_slot(center_slot_template, ctx, /*$$scope*/ ctx[8], get_center_slot_context);
	const end_slot_template = /*#slots*/ ctx[9].end;
	const end_slot = create_slot(end_slot_template, ctx, /*$$scope*/ ctx[8], get_end_slot_context);

	return {
		c() {
			nav = element("nav");
			div0 = element("div");
			if (start_slot) start_slot.c();
			t0 = space();
			div1 = element("div");
			if (center_slot) center_slot.c();
			t1 = space();
			div2 = element("div");
			if (end_slot) end_slot.c();
			attr(div0, "class", "navbar-start");
			attr(div1, "class", "navbar-center");
			attr(div2, "class", "navbar-end");
			attr(nav, "class", nav_class_value = "navbar z-30 " + /*variants*/ ctx[6][/*variant*/ ctx[1]] + " " + /*transparencies*/ ctx[5][/*transparency*/ ctx[2]] + " " + /*className*/ ctx[0] + " " + /*positoinClasses*/ ctx[4]);
			toggle_class(nav, "shadow-lg", /*shadow*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, nav, anchor);
			append(nav, div0);

			if (start_slot) {
				start_slot.m(div0, null);
			}

			append(nav, t0);
			append(nav, div1);

			if (center_slot) {
				center_slot.m(div1, null);
			}

			append(nav, t1);
			append(nav, div2);

			if (end_slot) {
				end_slot.m(div2, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (start_slot) {
				if (start_slot.p && (!current || dirty & /*$$scope*/ 256)) {
					update_slot_base(
						start_slot,
						start_slot_template,
						ctx,
						/*$$scope*/ ctx[8],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
						: get_slot_changes(start_slot_template, /*$$scope*/ ctx[8], dirty, get_start_slot_changes),
						get_start_slot_context
					);
				}
			}

			if (center_slot) {
				if (center_slot.p && (!current || dirty & /*$$scope*/ 256)) {
					update_slot_base(
						center_slot,
						center_slot_template,
						ctx,
						/*$$scope*/ ctx[8],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
						: get_slot_changes(center_slot_template, /*$$scope*/ ctx[8], dirty, get_center_slot_changes),
						get_center_slot_context
					);
				}
			}

			if (end_slot) {
				if (end_slot.p && (!current || dirty & /*$$scope*/ 256)) {
					update_slot_base(
						end_slot,
						end_slot_template,
						ctx,
						/*$$scope*/ ctx[8],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
						: get_slot_changes(end_slot_template, /*$$scope*/ ctx[8], dirty, get_end_slot_changes),
						get_end_slot_context
					);
				}
			}

			if (!current || dirty & /*variant, transparency, className, positoinClasses*/ 23 && nav_class_value !== (nav_class_value = "navbar z-30 " + /*variants*/ ctx[6][/*variant*/ ctx[1]] + " " + /*transparencies*/ ctx[5][/*transparency*/ ctx[2]] + " " + /*className*/ ctx[0] + " " + /*positoinClasses*/ ctx[4])) {
				attr(nav, "class", nav_class_value);
			}

			if (dirty & /*variant, transparency, className, positoinClasses, shadow*/ 31) {
				toggle_class(nav, "shadow-lg", /*shadow*/ ctx[3]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(start_slot, local);
			transition_in(center_slot, local);
			transition_in(end_slot, local);
			current = true;
		},
		o(local) {
			transition_out(start_slot, local);
			transition_out(center_slot, local);
			transition_out(end_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(nav);
			if (start_slot) start_slot.d(detaching);
			if (center_slot) center_slot.d(detaching);
			if (end_slot) end_slot.d(detaching);
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let positoinClasses;
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { variant = "primary" } = $$props;
	let { transparency = 'none' } = $$props;
	let { fixed = false } = $$props;
	let { shadow = false } = $$props;

	let transparencies = {
		none: 'bg-opacity-100',
		low: 'bg-opacity-75',
		medium: 'bg-opacity-50',
		high: 'bg-opacity-25',
		full: 'bg-opacity-0'
	};

	let variants = {
		base: 'bg-base-100 text-base-content',
		neutral: 'bg-neutral text-neutral-content',
		primary: 'bg-primary text-primary-content',
		secondary: 'bg-secondary text-secondary-content',
		accent: 'bg-accent text-accent-content',
		info: 'bg-info text-info-content',
		success: 'bg-success text-success-content',
		warning: 'bg-warning text-warning-content',
		error: 'bg-error text-error-content'
	};

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('variant' in $$props) $$invalidate(1, variant = $$props.variant);
		if ('transparency' in $$props) $$invalidate(2, transparency = $$props.transparency);
		if ('fixed' in $$props) $$invalidate(7, fixed = $$props.fixed);
		if ('shadow' in $$props) $$invalidate(3, shadow = $$props.shadow);
		if ('$$scope' in $$props) $$invalidate(8, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*fixed*/ 128) {
			$$invalidate(4, positoinClasses = fixed ? 'fixed w-full' : '');
		}
	};

	return [
		className,
		variant,
		transparency,
		shadow,
		positoinClasses,
		transparencies,
		variants,
		fixed,
		$$scope,
		slots
	];
}

class Navbar extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$6, create_fragment$7, safe_not_equal, {
			class: 0,
			variant: 1,
			transparency: 2,
			fixed: 7,
			shadow: 3
		});
	}
}

/* src/pagination/Pagination.svelte generated by Svelte v3.44.2 */

function create_fragment$6(ctx) {
	let ul;
	let ul_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

	return {
		c() {
			ul = element("ul");
			if (default_slot) default_slot.c();
			attr(ul, "class", ul_class_value = "btn-group " + /*className*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, ul, anchor);

			if (default_slot) {
				default_slot.m(ul, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[2],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && ul_class_value !== (ul_class_value = "btn-group " + /*className*/ ctx[0])) {
				attr(ul, "class", ul_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(ul);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { variant = 'primary' } = $$props;
	setContext('pagination:variant', variant);

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('variant' in $$props) $$invalidate(1, variant = $$props.variant);
		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	return [className, variant, $$scope, slots];
}

class Pagination extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$6, safe_not_equal, { class: 0, variant: 1 });
	}
}

/* src/pagination/PaginationItem.svelte generated by Svelte v3.44.2 */

function create_fragment$5(ctx) {
	let li;
	let li_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[6].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

	return {
		c() {
			li = element("li");
			if (default_slot) default_slot.c();
			attr(li, "class", li_class_value = "btn btn-" + /*variant*/ ctx[3] + " btn-" + /*size*/ ctx[4] + " " + /*className*/ ctx[0]);
			toggle_class(li, "btn-disabled", /*disabled*/ ctx[1]);
			toggle_class(li, "btn-active", /*active*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, li, anchor);

			if (default_slot) {
				default_slot.m(li, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[5],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*variant, size, className*/ 25 && li_class_value !== (li_class_value = "btn btn-" + /*variant*/ ctx[3] + " btn-" + /*size*/ ctx[4] + " " + /*className*/ ctx[0])) {
				attr(li, "class", li_class_value);
			}

			if (dirty & /*variant, size, className, disabled*/ 27) {
				toggle_class(li, "btn-disabled", /*disabled*/ ctx[1]);
			}

			if (dirty & /*variant, size, className, active*/ 29) {
				toggle_class(li, "btn-active", /*active*/ ctx[2]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { disabled = false } = $$props;
	let { active = false } = $$props;
	let { variant = getContext('pagination:variant') ?? 'primary' } = $$props;
	let { size = getContext('pagination:size') ?? 'md' } = $$props;

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('disabled' in $$props) $$invalidate(1, disabled = $$props.disabled);
		if ('active' in $$props) $$invalidate(2, active = $$props.active);
		if ('variant' in $$props) $$invalidate(3, variant = $$props.variant);
		if ('size' in $$props) $$invalidate(4, size = $$props.size);
		if ('$$scope' in $$props) $$invalidate(5, $$scope = $$props.$$scope);
	};

	return [className, disabled, active, variant, size, $$scope, slots];
}

class PaginationItem extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$4, create_fragment$5, safe_not_equal, {
			class: 0,
			disabled: 1,
			active: 2,
			variant: 3,
			size: 4
		});
	}
}

var top = 'top';
var bottom = 'bottom';
var right = 'right';
var left = 'left';
var auto = 'auto';
var basePlacements = [top, bottom, right, left];
var start = 'start';
var end = 'end';
var clippingParents = 'clippingParents';
var viewport = 'viewport';
var popper = 'popper';
var reference = 'reference';
var variationPlacements = /*#__PURE__*/basePlacements.reduce(function (acc, placement) {
  return acc.concat([placement + "-" + start, placement + "-" + end]);
}, []);
var placements = /*#__PURE__*/[].concat(basePlacements, [auto]).reduce(function (acc, placement) {
  return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
}, []); // modifiers that need to read the DOM

var beforeRead = 'beforeRead';
var read = 'read';
var afterRead = 'afterRead'; // pure-logic modifiers

var beforeMain = 'beforeMain';
var main = 'main';
var afterMain = 'afterMain'; // modifier with the purpose to write to the DOM (or write into a framework state)

var beforeWrite = 'beforeWrite';
var write = 'write';
var afterWrite = 'afterWrite';
var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

function getNodeName(element) {
  return element ? (element.nodeName || '').toLowerCase() : null;
}

function getWindow(node) {
  if (node == null) {
    return window;
  }

  if (node.toString() !== '[object Window]') {
    var ownerDocument = node.ownerDocument;
    return ownerDocument ? ownerDocument.defaultView || window : window;
  }

  return node;
}

function isElement(node) {
  var OwnElement = getWindow(node).Element;
  return node instanceof OwnElement || node instanceof Element;
}

function isHTMLElement(node) {
  var OwnElement = getWindow(node).HTMLElement;
  return node instanceof OwnElement || node instanceof HTMLElement;
}

function isShadowRoot(node) {
  // IE 11 has no ShadowRoot
  if (typeof ShadowRoot === 'undefined') {
    return false;
  }

  var OwnElement = getWindow(node).ShadowRoot;
  return node instanceof OwnElement || node instanceof ShadowRoot;
}

// and applies them to the HTMLElements such as popper and arrow

function applyStyles(_ref) {
  var state = _ref.state;
  Object.keys(state.elements).forEach(function (name) {
    var style = state.styles[name] || {};
    var attributes = state.attributes[name] || {};
    var element = state.elements[name]; // arrow is optional + virtual elements

    if (!isHTMLElement(element) || !getNodeName(element)) {
      return;
    } // Flow doesn't support to extend this property, but it's the most
    // effective way to apply styles to an HTMLElement
    // $FlowFixMe[cannot-write]


    Object.assign(element.style, style);
    Object.keys(attributes).forEach(function (name) {
      var value = attributes[name];

      if (value === false) {
        element.removeAttribute(name);
      } else {
        element.setAttribute(name, value === true ? '' : value);
      }
    });
  });
}

function effect$2(_ref2) {
  var state = _ref2.state;
  var initialStyles = {
    popper: {
      position: state.options.strategy,
      left: '0',
      top: '0',
      margin: '0'
    },
    arrow: {
      position: 'absolute'
    },
    reference: {}
  };
  Object.assign(state.elements.popper.style, initialStyles.popper);
  state.styles = initialStyles;

  if (state.elements.arrow) {
    Object.assign(state.elements.arrow.style, initialStyles.arrow);
  }

  return function () {
    Object.keys(state.elements).forEach(function (name) {
      var element = state.elements[name];
      var attributes = state.attributes[name] || {};
      var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]); // Set all values to an empty string to unset them

      var style = styleProperties.reduce(function (style, property) {
        style[property] = '';
        return style;
      }, {}); // arrow is optional + virtual elements

      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      }

      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function (attribute) {
        element.removeAttribute(attribute);
      });
    });
  };
} // eslint-disable-next-line import/no-unused-modules


var applyStyles$1 = {
  name: 'applyStyles',
  enabled: true,
  phase: 'write',
  fn: applyStyles,
  effect: effect$2,
  requires: ['computeStyles']
};

function getBasePlacement(placement) {
  return placement.split('-')[0];
}

var max = Math.max;
var min = Math.min;
var round = Math.round;

function getBoundingClientRect(element, includeScale) {
  if (includeScale === void 0) {
    includeScale = false;
  }

  var rect = element.getBoundingClientRect();
  var scaleX = 1;
  var scaleY = 1;

  if (isHTMLElement(element) && includeScale) {
    var offsetHeight = element.offsetHeight;
    var offsetWidth = element.offsetWidth; // Do not attempt to divide by 0, otherwise we get `Infinity` as scale
    // Fallback to 1 in case both values are `0`

    if (offsetWidth > 0) {
      scaleX = round(rect.width) / offsetWidth || 1;
    }

    if (offsetHeight > 0) {
      scaleY = round(rect.height) / offsetHeight || 1;
    }
  }

  return {
    width: rect.width / scaleX,
    height: rect.height / scaleY,
    top: rect.top / scaleY,
    right: rect.right / scaleX,
    bottom: rect.bottom / scaleY,
    left: rect.left / scaleX,
    x: rect.left / scaleX,
    y: rect.top / scaleY
  };
}

// means it doesn't take into account transforms.

function getLayoutRect(element) {
  var clientRect = getBoundingClientRect(element); // Use the clientRect sizes if it's not been transformed.
  // Fixes https://github.com/popperjs/popper-core/issues/1223

  var width = element.offsetWidth;
  var height = element.offsetHeight;

  if (Math.abs(clientRect.width - width) <= 1) {
    width = clientRect.width;
  }

  if (Math.abs(clientRect.height - height) <= 1) {
    height = clientRect.height;
  }

  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: width,
    height: height
  };
}

function contains(parent, child) {
  var rootNode = child.getRootNode && child.getRootNode(); // First, attempt with faster native method

  if (parent.contains(child)) {
    return true;
  } // then fallback to custom implementation with Shadow DOM support
  else if (rootNode && isShadowRoot(rootNode)) {
      var next = child;

      do {
        if (next && parent.isSameNode(next)) {
          return true;
        } // $FlowFixMe[prop-missing]: need a better way to handle this...


        next = next.parentNode || next.host;
      } while (next);
    } // Give up, the result is false


  return false;
}

function getComputedStyle$1(element) {
  return getWindow(element).getComputedStyle(element);
}

function isTableElement(element) {
  return ['table', 'td', 'th'].indexOf(getNodeName(element)) >= 0;
}

function getDocumentElement(element) {
  // $FlowFixMe[incompatible-return]: assume body is always available
  return ((isElement(element) ? element.ownerDocument : // $FlowFixMe[prop-missing]
  element.document) || window.document).documentElement;
}

function getParentNode(element) {
  if (getNodeName(element) === 'html') {
    return element;
  }

  return (// this is a quicker (but less type safe) way to save quite some bytes from the bundle
    // $FlowFixMe[incompatible-return]
    // $FlowFixMe[prop-missing]
    element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
    element.parentNode || ( // DOM Element detected
    isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
    // $FlowFixMe[incompatible-call]: HTMLElement is a Node
    getDocumentElement(element) // fallback

  );
}

function getTrueOffsetParent(element) {
  if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
  getComputedStyle$1(element).position === 'fixed') {
    return null;
  }

  return element.offsetParent;
} // `.offsetParent` reports `null` for fixed elements, while absolute elements
// return the containing block


function getContainingBlock(element) {
  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
  var isIE = navigator.userAgent.indexOf('Trident') !== -1;

  if (isIE && isHTMLElement(element)) {
    // In IE 9, 10 and 11 fixed elements containing block is always established by the viewport
    var elementCss = getComputedStyle$1(element);

    if (elementCss.position === 'fixed') {
      return null;
    }
  }

  var currentNode = getParentNode(element);

  while (isHTMLElement(currentNode) && ['html', 'body'].indexOf(getNodeName(currentNode)) < 0) {
    var css = getComputedStyle$1(currentNode); // This is non-exhaustive but covers the most common CSS properties that
    // create a containing block.
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block

    if (css.transform !== 'none' || css.perspective !== 'none' || css.contain === 'paint' || ['transform', 'perspective'].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === 'filter' || isFirefox && css.filter && css.filter !== 'none') {
      return currentNode;
    } else {
      currentNode = currentNode.parentNode;
    }
  }

  return null;
} // Gets the closest ancestor positioned element. Handles some edge cases,
// such as table ancestors and cross browser bugs.


function getOffsetParent(element) {
  var window = getWindow(element);
  var offsetParent = getTrueOffsetParent(element);

  while (offsetParent && isTableElement(offsetParent) && getComputedStyle$1(offsetParent).position === 'static') {
    offsetParent = getTrueOffsetParent(offsetParent);
  }

  if (offsetParent && (getNodeName(offsetParent) === 'html' || getNodeName(offsetParent) === 'body' && getComputedStyle$1(offsetParent).position === 'static')) {
    return window;
  }

  return offsetParent || getContainingBlock(element) || window;
}

function getMainAxisFromPlacement(placement) {
  return ['top', 'bottom'].indexOf(placement) >= 0 ? 'x' : 'y';
}

function within(min$1, value, max$1) {
  return max(min$1, min(value, max$1));
}
function withinMaxClamp(min, value, max) {
  var v = within(min, value, max);
  return v > max ? max : v;
}

function getFreshSideObject() {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
}

function mergePaddingObject(paddingObject) {
  return Object.assign({}, getFreshSideObject(), paddingObject);
}

function expandToHashMap(value, keys) {
  return keys.reduce(function (hashMap, key) {
    hashMap[key] = value;
    return hashMap;
  }, {});
}

var toPaddingObject = function toPaddingObject(padding, state) {
  padding = typeof padding === 'function' ? padding(Object.assign({}, state.rects, {
    placement: state.placement
  })) : padding;
  return mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements));
};

function arrow(_ref) {
  var _state$modifiersData$;

  var state = _ref.state,
      name = _ref.name,
      options = _ref.options;
  var arrowElement = state.elements.arrow;
  var popperOffsets = state.modifiersData.popperOffsets;
  var basePlacement = getBasePlacement(state.placement);
  var axis = getMainAxisFromPlacement(basePlacement);
  var isVertical = [left, right].indexOf(basePlacement) >= 0;
  var len = isVertical ? 'height' : 'width';

  if (!arrowElement || !popperOffsets) {
    return;
  }

  var paddingObject = toPaddingObject(options.padding, state);
  var arrowRect = getLayoutRect(arrowElement);
  var minProp = axis === 'y' ? top : left;
  var maxProp = axis === 'y' ? bottom : right;
  var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets[axis] - state.rects.popper[len];
  var startDiff = popperOffsets[axis] - state.rects.reference[axis];
  var arrowOffsetParent = getOffsetParent(arrowElement);
  var clientSize = arrowOffsetParent ? axis === 'y' ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
  var centerToReference = endDiff / 2 - startDiff / 2; // Make sure the arrow doesn't overflow the popper if the center point is
  // outside of the popper bounds

  var min = paddingObject[minProp];
  var max = clientSize - arrowRect[len] - paddingObject[maxProp];
  var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
  var offset = within(min, center, max); // Prevents breaking syntax highlighting...

  var axisProp = axis;
  state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset, _state$modifiersData$.centerOffset = offset - center, _state$modifiersData$);
}

function effect$1(_ref2) {
  var state = _ref2.state,
      options = _ref2.options;
  var _options$element = options.element,
      arrowElement = _options$element === void 0 ? '[data-popper-arrow]' : _options$element;

  if (arrowElement == null) {
    return;
  } // CSS selector


  if (typeof arrowElement === 'string') {
    arrowElement = state.elements.popper.querySelector(arrowElement);

    if (!arrowElement) {
      return;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    if (!isHTMLElement(arrowElement)) {
      console.error(['Popper: "arrow" element must be an HTMLElement (not an SVGElement).', 'To use an SVG arrow, wrap it in an HTMLElement that will be used as', 'the arrow.'].join(' '));
    }
  }

  if (!contains(state.elements.popper, arrowElement)) {
    if (process.env.NODE_ENV !== "production") {
      console.error(['Popper: "arrow" modifier\'s `element` must be a child of the popper', 'element.'].join(' '));
    }

    return;
  }

  state.elements.arrow = arrowElement;
} // eslint-disable-next-line import/no-unused-modules


var arrow$1 = {
  name: 'arrow',
  enabled: true,
  phase: 'main',
  fn: arrow,
  effect: effect$1,
  requires: ['popperOffsets'],
  requiresIfExists: ['preventOverflow']
};

function getVariation(placement) {
  return placement.split('-')[1];
}

var unsetSides = {
  top: 'auto',
  right: 'auto',
  bottom: 'auto',
  left: 'auto'
}; // Round the offsets to the nearest suitable subpixel based on the DPR.
// Zooming can change the DPR, but it seems to report a value that will
// cleanly divide the values into the appropriate subpixels.

function roundOffsetsByDPR(_ref) {
  var x = _ref.x,
      y = _ref.y;
  var win = window;
  var dpr = win.devicePixelRatio || 1;
  return {
    x: round(x * dpr) / dpr || 0,
    y: round(y * dpr) / dpr || 0
  };
}

function mapToStyles(_ref2) {
  var _Object$assign2;

  var popper = _ref2.popper,
      popperRect = _ref2.popperRect,
      placement = _ref2.placement,
      variation = _ref2.variation,
      offsets = _ref2.offsets,
      position = _ref2.position,
      gpuAcceleration = _ref2.gpuAcceleration,
      adaptive = _ref2.adaptive,
      roundOffsets = _ref2.roundOffsets,
      isFixed = _ref2.isFixed;

  var _ref3 = roundOffsets === true ? roundOffsetsByDPR(offsets) : typeof roundOffsets === 'function' ? roundOffsets(offsets) : offsets,
      _ref3$x = _ref3.x,
      x = _ref3$x === void 0 ? 0 : _ref3$x,
      _ref3$y = _ref3.y,
      y = _ref3$y === void 0 ? 0 : _ref3$y;

  var hasX = offsets.hasOwnProperty('x');
  var hasY = offsets.hasOwnProperty('y');
  var sideX = left;
  var sideY = top;
  var win = window;

  if (adaptive) {
    var offsetParent = getOffsetParent(popper);
    var heightProp = 'clientHeight';
    var widthProp = 'clientWidth';

    if (offsetParent === getWindow(popper)) {
      offsetParent = getDocumentElement(popper);

      if (getComputedStyle$1(offsetParent).position !== 'static' && position === 'absolute') {
        heightProp = 'scrollHeight';
        widthProp = 'scrollWidth';
      }
    } // $FlowFixMe[incompatible-cast]: force type refinement, we compare offsetParent with window above, but Flow doesn't detect it


    offsetParent = offsetParent;

    if (placement === top || (placement === left || placement === right) && variation === end) {
      sideY = bottom;
      var offsetY = isFixed && win.visualViewport ? win.visualViewport.height : // $FlowFixMe[prop-missing]
      offsetParent[heightProp];
      y -= offsetY - popperRect.height;
      y *= gpuAcceleration ? 1 : -1;
    }

    if (placement === left || (placement === top || placement === bottom) && variation === end) {
      sideX = right;
      var offsetX = isFixed && win.visualViewport ? win.visualViewport.width : // $FlowFixMe[prop-missing]
      offsetParent[widthProp];
      x -= offsetX - popperRect.width;
      x *= gpuAcceleration ? 1 : -1;
    }
  }

  var commonStyles = Object.assign({
    position: position
  }, adaptive && unsetSides);

  if (gpuAcceleration) {
    var _Object$assign;

    return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? '0' : '', _Object$assign[sideX] = hasX ? '0' : '', _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
  }

  return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : '', _Object$assign2[sideX] = hasX ? x + "px" : '', _Object$assign2.transform = '', _Object$assign2));
}

function computeStyles(_ref4) {
  var state = _ref4.state,
      options = _ref4.options;
  var _options$gpuAccelerat = options.gpuAcceleration,
      gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat,
      _options$adaptive = options.adaptive,
      adaptive = _options$adaptive === void 0 ? true : _options$adaptive,
      _options$roundOffsets = options.roundOffsets,
      roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;

  if (process.env.NODE_ENV !== "production") {
    var transitionProperty = getComputedStyle$1(state.elements.popper).transitionProperty || '';

    if (adaptive && ['transform', 'top', 'right', 'bottom', 'left'].some(function (property) {
      return transitionProperty.indexOf(property) >= 0;
    })) {
      console.warn(['Popper: Detected CSS transitions on at least one of the following', 'CSS properties: "transform", "top", "right", "bottom", "left".', '\n\n', 'Disable the "computeStyles" modifier\'s `adaptive` option to allow', 'for smooth transitions, or remove these properties from the CSS', 'transition declaration on the popper element if only transitioning', 'opacity or background-color for example.', '\n\n', 'We recommend using the popper element as a wrapper around an inner', 'element that can have any CSS property transitioned for animations.'].join(' '));
    }
  }

  var commonStyles = {
    placement: getBasePlacement(state.placement),
    variation: getVariation(state.placement),
    popper: state.elements.popper,
    popperRect: state.rects.popper,
    gpuAcceleration: gpuAcceleration,
    isFixed: state.options.strategy === 'fixed'
  };

  if (state.modifiersData.popperOffsets != null) {
    state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
      offsets: state.modifiersData.popperOffsets,
      position: state.options.strategy,
      adaptive: adaptive,
      roundOffsets: roundOffsets
    })));
  }

  if (state.modifiersData.arrow != null) {
    state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
      offsets: state.modifiersData.arrow,
      position: 'absolute',
      adaptive: false,
      roundOffsets: roundOffsets
    })));
  }

  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    'data-popper-placement': state.placement
  });
} // eslint-disable-next-line import/no-unused-modules


var computeStyles$1 = {
  name: 'computeStyles',
  enabled: true,
  phase: 'beforeWrite',
  fn: computeStyles,
  data: {}
};

var passive = {
  passive: true
};

function effect(_ref) {
  var state = _ref.state,
      instance = _ref.instance,
      options = _ref.options;
  var _options$scroll = options.scroll,
      scroll = _options$scroll === void 0 ? true : _options$scroll,
      _options$resize = options.resize,
      resize = _options$resize === void 0 ? true : _options$resize;
  var window = getWindow(state.elements.popper);
  var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);

  if (scroll) {
    scrollParents.forEach(function (scrollParent) {
      scrollParent.addEventListener('scroll', instance.update, passive);
    });
  }

  if (resize) {
    window.addEventListener('resize', instance.update, passive);
  }

  return function () {
    if (scroll) {
      scrollParents.forEach(function (scrollParent) {
        scrollParent.removeEventListener('scroll', instance.update, passive);
      });
    }

    if (resize) {
      window.removeEventListener('resize', instance.update, passive);
    }
  };
} // eslint-disable-next-line import/no-unused-modules


var eventListeners = {
  name: 'eventListeners',
  enabled: true,
  phase: 'write',
  fn: function fn() {},
  effect: effect,
  data: {}
};

var hash$1 = {
  left: 'right',
  right: 'left',
  bottom: 'top',
  top: 'bottom'
};
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, function (matched) {
    return hash$1[matched];
  });
}

var hash = {
  start: 'end',
  end: 'start'
};
function getOppositeVariationPlacement(placement) {
  return placement.replace(/start|end/g, function (matched) {
    return hash[matched];
  });
}

function getWindowScroll(node) {
  var win = getWindow(node);
  var scrollLeft = win.pageXOffset;
  var scrollTop = win.pageYOffset;
  return {
    scrollLeft: scrollLeft,
    scrollTop: scrollTop
  };
}

function getWindowScrollBarX(element) {
  // If <html> has a CSS width greater than the viewport, then this will be
  // incorrect for RTL.
  // Popper 1 is broken in this case and never had a bug report so let's assume
  // it's not an issue. I don't think anyone ever specifies width on <html>
  // anyway.
  // Browsers where the left scrollbar doesn't cause an issue report `0` for
  // this (e.g. Edge 2019, IE11, Safari)
  return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
}

function getViewportRect(element) {
  var win = getWindow(element);
  var html = getDocumentElement(element);
  var visualViewport = win.visualViewport;
  var width = html.clientWidth;
  var height = html.clientHeight;
  var x = 0;
  var y = 0; // NB: This isn't supported on iOS <= 12. If the keyboard is open, the popper
  // can be obscured underneath it.
  // Also, `html.clientHeight` adds the bottom bar height in Safari iOS, even
  // if it isn't open, so if this isn't available, the popper will be detected
  // to overflow the bottom of the screen too early.

  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height; // Uses Layout Viewport (like Chrome; Safari does not currently)
    // In Chrome, it returns a value very close to 0 (+/-) but contains rounding
    // errors due to floating point numbers, so we need to check precision.
    // Safari returns a number <= 0, usually < -1 when pinch-zoomed
    // Feature detection fails in mobile emulation mode in Chrome.
    // Math.abs(win.innerWidth / visualViewport.scale - visualViewport.width) <
    // 0.001
    // Fallback here: "Not Safari" userAgent

    if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }

  return {
    width: width,
    height: height,
    x: x + getWindowScrollBarX(element),
    y: y
  };
}

// of the `<html>` and `<body>` rect bounds if horizontally scrollable

function getDocumentRect(element) {
  var _element$ownerDocumen;

  var html = getDocumentElement(element);
  var winScroll = getWindowScroll(element);
  var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
  var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
  var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
  var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
  var y = -winScroll.scrollTop;

  if (getComputedStyle$1(body || html).direction === 'rtl') {
    x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
  }

  return {
    width: width,
    height: height,
    x: x,
    y: y
  };
}

function isScrollParent(element) {
  // Firefox wants us to check `-x` and `-y` variations as well
  var _getComputedStyle = getComputedStyle$1(element),
      overflow = _getComputedStyle.overflow,
      overflowX = _getComputedStyle.overflowX,
      overflowY = _getComputedStyle.overflowY;

  return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
}

function getScrollParent(node) {
  if (['html', 'body', '#document'].indexOf(getNodeName(node)) >= 0) {
    // $FlowFixMe[incompatible-return]: assume body is always available
    return node.ownerDocument.body;
  }

  if (isHTMLElement(node) && isScrollParent(node)) {
    return node;
  }

  return getScrollParent(getParentNode(node));
}

/*
given a DOM element, return the list of all scroll parents, up the list of ancesors
until we get to the top window object. This list is what we attach scroll listeners
to, because if any of these parent elements scroll, we'll need to re-calculate the
reference element's position.
*/

function listScrollParents(element, list) {
  var _element$ownerDocumen;

  if (list === void 0) {
    list = [];
  }

  var scrollParent = getScrollParent(element);
  var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
  var win = getWindow(scrollParent);
  var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
  var updatedList = list.concat(target);
  return isBody ? updatedList : // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
  updatedList.concat(listScrollParents(getParentNode(target)));
}

function rectToClientRect(rect) {
  return Object.assign({}, rect, {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height
  });
}

function getInnerBoundingClientRect(element) {
  var rect = getBoundingClientRect(element);
  rect.top = rect.top + element.clientTop;
  rect.left = rect.left + element.clientLeft;
  rect.bottom = rect.top + element.clientHeight;
  rect.right = rect.left + element.clientWidth;
  rect.width = element.clientWidth;
  rect.height = element.clientHeight;
  rect.x = rect.left;
  rect.y = rect.top;
  return rect;
}

function getClientRectFromMixedType(element, clippingParent) {
  return clippingParent === viewport ? rectToClientRect(getViewportRect(element)) : isElement(clippingParent) ? getInnerBoundingClientRect(clippingParent) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
} // A "clipping parent" is an overflowable container with the characteristic of
// clipping (or hiding) overflowing elements with a position different from
// `initial`


function getClippingParents(element) {
  var clippingParents = listScrollParents(getParentNode(element));
  var canEscapeClipping = ['absolute', 'fixed'].indexOf(getComputedStyle$1(element).position) >= 0;
  var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;

  if (!isElement(clipperElement)) {
    return [];
  } // $FlowFixMe[incompatible-return]: https://github.com/facebook/flow/issues/1414


  return clippingParents.filter(function (clippingParent) {
    return isElement(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== 'body' && (canEscapeClipping ? getComputedStyle$1(clippingParent).position !== 'static' : true);
  });
} // Gets the maximum area that the element is visible in due to any number of
// clipping parents


function getClippingRect(element, boundary, rootBoundary) {
  var mainClippingParents = boundary === 'clippingParents' ? getClippingParents(element) : [].concat(boundary);
  var clippingParents = [].concat(mainClippingParents, [rootBoundary]);
  var firstClippingParent = clippingParents[0];
  var clippingRect = clippingParents.reduce(function (accRect, clippingParent) {
    var rect = getClientRectFromMixedType(element, clippingParent);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromMixedType(element, firstClippingParent));
  clippingRect.width = clippingRect.right - clippingRect.left;
  clippingRect.height = clippingRect.bottom - clippingRect.top;
  clippingRect.x = clippingRect.left;
  clippingRect.y = clippingRect.top;
  return clippingRect;
}

function computeOffsets(_ref) {
  var reference = _ref.reference,
      element = _ref.element,
      placement = _ref.placement;
  var basePlacement = placement ? getBasePlacement(placement) : null;
  var variation = placement ? getVariation(placement) : null;
  var commonX = reference.x + reference.width / 2 - element.width / 2;
  var commonY = reference.y + reference.height / 2 - element.height / 2;
  var offsets;

  switch (basePlacement) {
    case top:
      offsets = {
        x: commonX,
        y: reference.y - element.height
      };
      break;

    case bottom:
      offsets = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;

    case right:
      offsets = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;

    case left:
      offsets = {
        x: reference.x - element.width,
        y: commonY
      };
      break;

    default:
      offsets = {
        x: reference.x,
        y: reference.y
      };
  }

  var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;

  if (mainAxis != null) {
    var len = mainAxis === 'y' ? 'height' : 'width';

    switch (variation) {
      case start:
        offsets[mainAxis] = offsets[mainAxis] - (reference[len] / 2 - element[len] / 2);
        break;

      case end:
        offsets[mainAxis] = offsets[mainAxis] + (reference[len] / 2 - element[len] / 2);
        break;
    }
  }

  return offsets;
}

function detectOverflow(state, options) {
  if (options === void 0) {
    options = {};
  }

  var _options = options,
      _options$placement = _options.placement,
      placement = _options$placement === void 0 ? state.placement : _options$placement,
      _options$boundary = _options.boundary,
      boundary = _options$boundary === void 0 ? clippingParents : _options$boundary,
      _options$rootBoundary = _options.rootBoundary,
      rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary,
      _options$elementConte = _options.elementContext,
      elementContext = _options$elementConte === void 0 ? popper : _options$elementConte,
      _options$altBoundary = _options.altBoundary,
      altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary,
      _options$padding = _options.padding,
      padding = _options$padding === void 0 ? 0 : _options$padding;
  var paddingObject = mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements));
  var altContext = elementContext === popper ? reference : popper;
  var popperRect = state.rects.popper;
  var element = state.elements[altBoundary ? altContext : elementContext];
  var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary);
  var referenceClientRect = getBoundingClientRect(state.elements.reference);
  var popperOffsets = computeOffsets({
    reference: referenceClientRect,
    element: popperRect,
    strategy: 'absolute',
    placement: placement
  });
  var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets));
  var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect; // positive = overflowing the clipping rect
  // 0 or negative = within the clipping rect

  var overflowOffsets = {
    top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
    bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
    left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
    right: elementClientRect.right - clippingClientRect.right + paddingObject.right
  };
  var offsetData = state.modifiersData.offset; // Offsets can be applied only to the popper element

  if (elementContext === popper && offsetData) {
    var offset = offsetData[placement];
    Object.keys(overflowOffsets).forEach(function (key) {
      var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
      var axis = [top, bottom].indexOf(key) >= 0 ? 'y' : 'x';
      overflowOffsets[key] += offset[axis] * multiply;
    });
  }

  return overflowOffsets;
}

function computeAutoPlacement(state, options) {
  if (options === void 0) {
    options = {};
  }

  var _options = options,
      placement = _options.placement,
      boundary = _options.boundary,
      rootBoundary = _options.rootBoundary,
      padding = _options.padding,
      flipVariations = _options.flipVariations,
      _options$allowedAutoP = _options.allowedAutoPlacements,
      allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
  var variation = getVariation(placement);
  var placements$1 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function (placement) {
    return getVariation(placement) === variation;
  }) : basePlacements;
  var allowedPlacements = placements$1.filter(function (placement) {
    return allowedAutoPlacements.indexOf(placement) >= 0;
  });

  if (allowedPlacements.length === 0) {
    allowedPlacements = placements$1;

    if (process.env.NODE_ENV !== "production") {
      console.error(['Popper: The `allowedAutoPlacements` option did not allow any', 'placements. Ensure the `placement` option matches the variation', 'of the allowed placements.', 'For example, "auto" cannot be used to allow "bottom-start".', 'Use "auto-start" instead.'].join(' '));
    }
  } // $FlowFixMe[incompatible-type]: Flow seems to have problems with two array unions...


  var overflows = allowedPlacements.reduce(function (acc, placement) {
    acc[placement] = detectOverflow(state, {
      placement: placement,
      boundary: boundary,
      rootBoundary: rootBoundary,
      padding: padding
    })[getBasePlacement(placement)];
    return acc;
  }, {});
  return Object.keys(overflows).sort(function (a, b) {
    return overflows[a] - overflows[b];
  });
}

function getExpandedFallbackPlacements(placement) {
  if (getBasePlacement(placement) === auto) {
    return [];
  }

  var oppositePlacement = getOppositePlacement(placement);
  return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
}

function flip(_ref) {
  var state = _ref.state,
      options = _ref.options,
      name = _ref.name;

  if (state.modifiersData[name]._skip) {
    return;
  }

  var _options$mainAxis = options.mainAxis,
      checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
      _options$altAxis = options.altAxis,
      checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis,
      specifiedFallbackPlacements = options.fallbackPlacements,
      padding = options.padding,
      boundary = options.boundary,
      rootBoundary = options.rootBoundary,
      altBoundary = options.altBoundary,
      _options$flipVariatio = options.flipVariations,
      flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio,
      allowedAutoPlacements = options.allowedAutoPlacements;
  var preferredPlacement = state.options.placement;
  var basePlacement = getBasePlacement(preferredPlacement);
  var isBasePlacement = basePlacement === preferredPlacement;
  var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
  var placements = [preferredPlacement].concat(fallbackPlacements).reduce(function (acc, placement) {
    return acc.concat(getBasePlacement(placement) === auto ? computeAutoPlacement(state, {
      placement: placement,
      boundary: boundary,
      rootBoundary: rootBoundary,
      padding: padding,
      flipVariations: flipVariations,
      allowedAutoPlacements: allowedAutoPlacements
    }) : placement);
  }, []);
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var checksMap = new Map();
  var makeFallbackChecks = true;
  var firstFittingPlacement = placements[0];

  for (var i = 0; i < placements.length; i++) {
    var placement = placements[i];

    var _basePlacement = getBasePlacement(placement);

    var isStartVariation = getVariation(placement) === start;
    var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
    var len = isVertical ? 'width' : 'height';
    var overflow = detectOverflow(state, {
      placement: placement,
      boundary: boundary,
      rootBoundary: rootBoundary,
      altBoundary: altBoundary,
      padding: padding
    });
    var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;

    if (referenceRect[len] > popperRect[len]) {
      mainVariationSide = getOppositePlacement(mainVariationSide);
    }

    var altVariationSide = getOppositePlacement(mainVariationSide);
    var checks = [];

    if (checkMainAxis) {
      checks.push(overflow[_basePlacement] <= 0);
    }

    if (checkAltAxis) {
      checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
    }

    if (checks.every(function (check) {
      return check;
    })) {
      firstFittingPlacement = placement;
      makeFallbackChecks = false;
      break;
    }

    checksMap.set(placement, checks);
  }

  if (makeFallbackChecks) {
    // `2` may be desired in some cases – research later
    var numberOfChecks = flipVariations ? 3 : 1;

    var _loop = function _loop(_i) {
      var fittingPlacement = placements.find(function (placement) {
        var checks = checksMap.get(placement);

        if (checks) {
          return checks.slice(0, _i).every(function (check) {
            return check;
          });
        }
      });

      if (fittingPlacement) {
        firstFittingPlacement = fittingPlacement;
        return "break";
      }
    };

    for (var _i = numberOfChecks; _i > 0; _i--) {
      var _ret = _loop(_i);

      if (_ret === "break") break;
    }
  }

  if (state.placement !== firstFittingPlacement) {
    state.modifiersData[name]._skip = true;
    state.placement = firstFittingPlacement;
    state.reset = true;
  }
} // eslint-disable-next-line import/no-unused-modules


var flip$1 = {
  name: 'flip',
  enabled: true,
  phase: 'main',
  fn: flip,
  requiresIfExists: ['offset'],
  data: {
    _skip: false
  }
};

function getSideOffsets(overflow, rect, preventedOffsets) {
  if (preventedOffsets === void 0) {
    preventedOffsets = {
      x: 0,
      y: 0
    };
  }

  return {
    top: overflow.top - rect.height - preventedOffsets.y,
    right: overflow.right - rect.width + preventedOffsets.x,
    bottom: overflow.bottom - rect.height + preventedOffsets.y,
    left: overflow.left - rect.width - preventedOffsets.x
  };
}

function isAnySideFullyClipped(overflow) {
  return [top, right, bottom, left].some(function (side) {
    return overflow[side] >= 0;
  });
}

function hide(_ref) {
  var state = _ref.state,
      name = _ref.name;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var preventedOffsets = state.modifiersData.preventOverflow;
  var referenceOverflow = detectOverflow(state, {
    elementContext: 'reference'
  });
  var popperAltOverflow = detectOverflow(state, {
    altBoundary: true
  });
  var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
  var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
  var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
  var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
  state.modifiersData[name] = {
    referenceClippingOffsets: referenceClippingOffsets,
    popperEscapeOffsets: popperEscapeOffsets,
    isReferenceHidden: isReferenceHidden,
    hasPopperEscaped: hasPopperEscaped
  };
  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    'data-popper-reference-hidden': isReferenceHidden,
    'data-popper-escaped': hasPopperEscaped
  });
} // eslint-disable-next-line import/no-unused-modules


var hide$1 = {
  name: 'hide',
  enabled: true,
  phase: 'main',
  requiresIfExists: ['preventOverflow'],
  fn: hide
};

function distanceAndSkiddingToXY(placement, rects, offset) {
  var basePlacement = getBasePlacement(placement);
  var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;

  var _ref = typeof offset === 'function' ? offset(Object.assign({}, rects, {
    placement: placement
  })) : offset,
      skidding = _ref[0],
      distance = _ref[1];

  skidding = skidding || 0;
  distance = (distance || 0) * invertDistance;
  return [left, right].indexOf(basePlacement) >= 0 ? {
    x: distance,
    y: skidding
  } : {
    x: skidding,
    y: distance
  };
}

function offset(_ref2) {
  var state = _ref2.state,
      options = _ref2.options,
      name = _ref2.name;
  var _options$offset = options.offset,
      offset = _options$offset === void 0 ? [0, 0] : _options$offset;
  var data = placements.reduce(function (acc, placement) {
    acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset);
    return acc;
  }, {});
  var _data$state$placement = data[state.placement],
      x = _data$state$placement.x,
      y = _data$state$placement.y;

  if (state.modifiersData.popperOffsets != null) {
    state.modifiersData.popperOffsets.x += x;
    state.modifiersData.popperOffsets.y += y;
  }

  state.modifiersData[name] = data;
} // eslint-disable-next-line import/no-unused-modules


var offset$1 = {
  name: 'offset',
  enabled: true,
  phase: 'main',
  requires: ['popperOffsets'],
  fn: offset
};

function popperOffsets(_ref) {
  var state = _ref.state,
      name = _ref.name;
  // Offsets are the actual position the popper needs to have to be
  // properly positioned near its reference element
  // This is the most basic placement, and will be adjusted by
  // the modifiers in the next step
  state.modifiersData[name] = computeOffsets({
    reference: state.rects.reference,
    element: state.rects.popper,
    strategy: 'absolute',
    placement: state.placement
  });
} // eslint-disable-next-line import/no-unused-modules


var popperOffsets$1 = {
  name: 'popperOffsets',
  enabled: true,
  phase: 'read',
  fn: popperOffsets,
  data: {}
};

function getAltAxis(axis) {
  return axis === 'x' ? 'y' : 'x';
}

function preventOverflow(_ref) {
  var state = _ref.state,
      options = _ref.options,
      name = _ref.name;
  var _options$mainAxis = options.mainAxis,
      checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
      _options$altAxis = options.altAxis,
      checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis,
      boundary = options.boundary,
      rootBoundary = options.rootBoundary,
      altBoundary = options.altBoundary,
      padding = options.padding,
      _options$tether = options.tether,
      tether = _options$tether === void 0 ? true : _options$tether,
      _options$tetherOffset = options.tetherOffset,
      tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
  var overflow = detectOverflow(state, {
    boundary: boundary,
    rootBoundary: rootBoundary,
    padding: padding,
    altBoundary: altBoundary
  });
  var basePlacement = getBasePlacement(state.placement);
  var variation = getVariation(state.placement);
  var isBasePlacement = !variation;
  var mainAxis = getMainAxisFromPlacement(basePlacement);
  var altAxis = getAltAxis(mainAxis);
  var popperOffsets = state.modifiersData.popperOffsets;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var tetherOffsetValue = typeof tetherOffset === 'function' ? tetherOffset(Object.assign({}, state.rects, {
    placement: state.placement
  })) : tetherOffset;
  var normalizedTetherOffsetValue = typeof tetherOffsetValue === 'number' ? {
    mainAxis: tetherOffsetValue,
    altAxis: tetherOffsetValue
  } : Object.assign({
    mainAxis: 0,
    altAxis: 0
  }, tetherOffsetValue);
  var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
  var data = {
    x: 0,
    y: 0
  };

  if (!popperOffsets) {
    return;
  }

  if (checkMainAxis) {
    var _offsetModifierState$;

    var mainSide = mainAxis === 'y' ? top : left;
    var altSide = mainAxis === 'y' ? bottom : right;
    var len = mainAxis === 'y' ? 'height' : 'width';
    var offset = popperOffsets[mainAxis];
    var min$1 = offset + overflow[mainSide];
    var max$1 = offset - overflow[altSide];
    var additive = tether ? -popperRect[len] / 2 : 0;
    var minLen = variation === start ? referenceRect[len] : popperRect[len];
    var maxLen = variation === start ? -popperRect[len] : -referenceRect[len]; // We need to include the arrow in the calculation so the arrow doesn't go
    // outside the reference bounds

    var arrowElement = state.elements.arrow;
    var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
      width: 0,
      height: 0
    };
    var arrowPaddingObject = state.modifiersData['arrow#persistent'] ? state.modifiersData['arrow#persistent'].padding : getFreshSideObject();
    var arrowPaddingMin = arrowPaddingObject[mainSide];
    var arrowPaddingMax = arrowPaddingObject[altSide]; // If the reference length is smaller than the arrow length, we don't want
    // to include its full size in the calculation. If the reference is small
    // and near the edge of a boundary, the popper can overflow even if the
    // reference is not overflowing as well (e.g. virtual elements with no
    // width or height)

    var arrowLen = within(0, referenceRect[len], arrowRect[len]);
    var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
    var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
    var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
    var clientOffset = arrowOffsetParent ? mainAxis === 'y' ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
    var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
    var tetherMin = offset + minOffset - offsetModifierValue - clientOffset;
    var tetherMax = offset + maxOffset - offsetModifierValue;
    var preventedOffset = within(tether ? min(min$1, tetherMin) : min$1, offset, tether ? max(max$1, tetherMax) : max$1);
    popperOffsets[mainAxis] = preventedOffset;
    data[mainAxis] = preventedOffset - offset;
  }

  if (checkAltAxis) {
    var _offsetModifierState$2;

    var _mainSide = mainAxis === 'x' ? top : left;

    var _altSide = mainAxis === 'x' ? bottom : right;

    var _offset = popperOffsets[altAxis];

    var _len = altAxis === 'y' ? 'height' : 'width';

    var _min = _offset + overflow[_mainSide];

    var _max = _offset - overflow[_altSide];

    var isOriginSide = [top, left].indexOf(basePlacement) !== -1;

    var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;

    var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;

    var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;

    var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);

    popperOffsets[altAxis] = _preventedOffset;
    data[altAxis] = _preventedOffset - _offset;
  }

  state.modifiersData[name] = data;
} // eslint-disable-next-line import/no-unused-modules


var preventOverflow$1 = {
  name: 'preventOverflow',
  enabled: true,
  phase: 'main',
  fn: preventOverflow,
  requiresIfExists: ['offset']
};

function getHTMLElementScroll(element) {
  return {
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop
  };
}

function getNodeScroll(node) {
  if (node === getWindow(node) || !isHTMLElement(node)) {
    return getWindowScroll(node);
  } else {
    return getHTMLElementScroll(node);
  }
}

function isElementScaled(element) {
  var rect = element.getBoundingClientRect();
  var scaleX = round(rect.width) / element.offsetWidth || 1;
  var scaleY = round(rect.height) / element.offsetHeight || 1;
  return scaleX !== 1 || scaleY !== 1;
} // Returns the composite rect of an element relative to its offsetParent.
// Composite means it takes into account transforms as well as layout.


function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
  if (isFixed === void 0) {
    isFixed = false;
  }

  var isOffsetParentAnElement = isHTMLElement(offsetParent);
  var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
  var documentElement = getDocumentElement(offsetParent);
  var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled);
  var scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  var offsets = {
    x: 0,
    y: 0
  };

  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== 'body' || // https://github.com/popperjs/popper-core/issues/1078
    isScrollParent(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }

    if (isHTMLElement(offsetParent)) {
      offsets = getBoundingClientRect(offsetParent, true);
      offsets.x += offsetParent.clientLeft;
      offsets.y += offsetParent.clientTop;
    } else if (documentElement) {
      offsets.x = getWindowScrollBarX(documentElement);
    }
  }

  return {
    x: rect.left + scroll.scrollLeft - offsets.x,
    y: rect.top + scroll.scrollTop - offsets.y,
    width: rect.width,
    height: rect.height
  };
}

function order(modifiers) {
  var map = new Map();
  var visited = new Set();
  var result = [];
  modifiers.forEach(function (modifier) {
    map.set(modifier.name, modifier);
  }); // On visiting object, check for its dependencies and visit them recursively

  function sort(modifier) {
    visited.add(modifier.name);
    var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
    requires.forEach(function (dep) {
      if (!visited.has(dep)) {
        var depModifier = map.get(dep);

        if (depModifier) {
          sort(depModifier);
        }
      }
    });
    result.push(modifier);
  }

  modifiers.forEach(function (modifier) {
    if (!visited.has(modifier.name)) {
      // check for visited object
      sort(modifier);
    }
  });
  return result;
}

function orderModifiers(modifiers) {
  // order based on dependencies
  var orderedModifiers = order(modifiers); // order based on phase

  return modifierPhases.reduce(function (acc, phase) {
    return acc.concat(orderedModifiers.filter(function (modifier) {
      return modifier.phase === phase;
    }));
  }, []);
}

function debounce(fn) {
  var pending;
  return function () {
    if (!pending) {
      pending = new Promise(function (resolve) {
        Promise.resolve().then(function () {
          pending = undefined;
          resolve(fn());
        });
      });
    }

    return pending;
  };
}

function format(str) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return [].concat(args).reduce(function (p, c) {
    return p.replace(/%s/, c);
  }, str);
}

var INVALID_MODIFIER_ERROR = 'Popper: modifier "%s" provided an invalid %s property, expected %s but got %s';
var MISSING_DEPENDENCY_ERROR = 'Popper: modifier "%s" requires "%s", but "%s" modifier is not available';
var VALID_PROPERTIES = ['name', 'enabled', 'phase', 'fn', 'effect', 'requires', 'options'];
function validateModifiers(modifiers) {
  modifiers.forEach(function (modifier) {
    [].concat(Object.keys(modifier), VALID_PROPERTIES) // IE11-compatible replacement for `new Set(iterable)`
    .filter(function (value, index, self) {
      return self.indexOf(value) === index;
    }).forEach(function (key) {
      switch (key) {
        case 'name':
          if (typeof modifier.name !== 'string') {
            console.error(format(INVALID_MODIFIER_ERROR, String(modifier.name), '"name"', '"string"', "\"" + String(modifier.name) + "\""));
          }

          break;

        case 'enabled':
          if (typeof modifier.enabled !== 'boolean') {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"enabled"', '"boolean"', "\"" + String(modifier.enabled) + "\""));
          }

          break;

        case 'phase':
          if (modifierPhases.indexOf(modifier.phase) < 0) {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"phase"', "either " + modifierPhases.join(', '), "\"" + String(modifier.phase) + "\""));
          }

          break;

        case 'fn':
          if (typeof modifier.fn !== 'function') {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"fn"', '"function"', "\"" + String(modifier.fn) + "\""));
          }

          break;

        case 'effect':
          if (modifier.effect != null && typeof modifier.effect !== 'function') {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"effect"', '"function"', "\"" + String(modifier.fn) + "\""));
          }

          break;

        case 'requires':
          if (modifier.requires != null && !Array.isArray(modifier.requires)) {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requires"', '"array"', "\"" + String(modifier.requires) + "\""));
          }

          break;

        case 'requiresIfExists':
          if (!Array.isArray(modifier.requiresIfExists)) {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requiresIfExists"', '"array"', "\"" + String(modifier.requiresIfExists) + "\""));
          }

          break;

        case 'options':
        case 'data':
          break;

        default:
          console.error("PopperJS: an invalid property has been provided to the \"" + modifier.name + "\" modifier, valid properties are " + VALID_PROPERTIES.map(function (s) {
            return "\"" + s + "\"";
          }).join(', ') + "; but \"" + key + "\" was provided.");
      }

      modifier.requires && modifier.requires.forEach(function (requirement) {
        if (modifiers.find(function (mod) {
          return mod.name === requirement;
        }) == null) {
          console.error(format(MISSING_DEPENDENCY_ERROR, String(modifier.name), requirement, requirement));
        }
      });
    });
  });
}

function uniqueBy(arr, fn) {
  var identifiers = new Set();
  return arr.filter(function (item) {
    var identifier = fn(item);

    if (!identifiers.has(identifier)) {
      identifiers.add(identifier);
      return true;
    }
  });
}

function mergeByName(modifiers) {
  var merged = modifiers.reduce(function (merged, current) {
    var existing = merged[current.name];
    merged[current.name] = existing ? Object.assign({}, existing, current, {
      options: Object.assign({}, existing.options, current.options),
      data: Object.assign({}, existing.data, current.data)
    }) : current;
    return merged;
  }, {}); // IE11 does not support Object.values

  return Object.keys(merged).map(function (key) {
    return merged[key];
  });
}

var INVALID_ELEMENT_ERROR = 'Popper: Invalid reference or popper argument provided. They must be either a DOM element or virtual element.';
var INFINITE_LOOP_ERROR = 'Popper: An infinite loop in the modifiers cycle has been detected! The cycle has been interrupted to prevent a browser crash.';
var DEFAULT_OPTIONS = {
  placement: 'bottom',
  modifiers: [],
  strategy: 'absolute'
};

function areValidElements() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return !args.some(function (element) {
    return !(element && typeof element.getBoundingClientRect === 'function');
  });
}

function popperGenerator(generatorOptions) {
  if (generatorOptions === void 0) {
    generatorOptions = {};
  }

  var _generatorOptions = generatorOptions,
      _generatorOptions$def = _generatorOptions.defaultModifiers,
      defaultModifiers = _generatorOptions$def === void 0 ? [] : _generatorOptions$def,
      _generatorOptions$def2 = _generatorOptions.defaultOptions,
      defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
  return function createPopper(reference, popper, options) {
    if (options === void 0) {
      options = defaultOptions;
    }

    var state = {
      placement: 'bottom',
      orderedModifiers: [],
      options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
      modifiersData: {},
      elements: {
        reference: reference,
        popper: popper
      },
      attributes: {},
      styles: {}
    };
    var effectCleanupFns = [];
    var isDestroyed = false;
    var instance = {
      state: state,
      setOptions: function setOptions(setOptionsAction) {
        var options = typeof setOptionsAction === 'function' ? setOptionsAction(state.options) : setOptionsAction;
        cleanupModifierEffects();
        state.options = Object.assign({}, defaultOptions, state.options, options);
        state.scrollParents = {
          reference: isElement(reference) ? listScrollParents(reference) : reference.contextElement ? listScrollParents(reference.contextElement) : [],
          popper: listScrollParents(popper)
        }; // Orders the modifiers based on their dependencies and `phase`
        // properties

        var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers, state.options.modifiers))); // Strip out disabled modifiers

        state.orderedModifiers = orderedModifiers.filter(function (m) {
          return m.enabled;
        }); // Validate the provided modifiers so that the consumer will get warned
        // if one of the modifiers is invalid for any reason

        if (process.env.NODE_ENV !== "production") {
          var modifiers = uniqueBy([].concat(orderedModifiers, state.options.modifiers), function (_ref) {
            var name = _ref.name;
            return name;
          });
          validateModifiers(modifiers);

          if (getBasePlacement(state.options.placement) === auto) {
            var flipModifier = state.orderedModifiers.find(function (_ref2) {
              var name = _ref2.name;
              return name === 'flip';
            });

            if (!flipModifier) {
              console.error(['Popper: "auto" placements require the "flip" modifier be', 'present and enabled to work.'].join(' '));
            }
          }

          var _getComputedStyle = getComputedStyle$1(popper),
              marginTop = _getComputedStyle.marginTop,
              marginRight = _getComputedStyle.marginRight,
              marginBottom = _getComputedStyle.marginBottom,
              marginLeft = _getComputedStyle.marginLeft; // We no longer take into account `margins` on the popper, and it can
          // cause bugs with positioning, so we'll warn the consumer


          if ([marginTop, marginRight, marginBottom, marginLeft].some(function (margin) {
            return parseFloat(margin);
          })) {
            console.warn(['Popper: CSS "margin" styles cannot be used to apply padding', 'between the popper and its reference element or boundary.', 'To replicate margin, use the `offset` modifier, as well as', 'the `padding` option in the `preventOverflow` and `flip`', 'modifiers.'].join(' '));
          }
        }

        runModifierEffects();
        return instance.update();
      },
      // Sync update – it will always be executed, even if not necessary. This
      // is useful for low frequency updates where sync behavior simplifies the
      // logic.
      // For high frequency updates (e.g. `resize` and `scroll` events), always
      // prefer the async Popper#update method
      forceUpdate: function forceUpdate() {
        if (isDestroyed) {
          return;
        }

        var _state$elements = state.elements,
            reference = _state$elements.reference,
            popper = _state$elements.popper; // Don't proceed if `reference` or `popper` are not valid elements
        // anymore

        if (!areValidElements(reference, popper)) {
          if (process.env.NODE_ENV !== "production") {
            console.error(INVALID_ELEMENT_ERROR);
          }

          return;
        } // Store the reference and popper rects to be read by modifiers


        state.rects = {
          reference: getCompositeRect(reference, getOffsetParent(popper), state.options.strategy === 'fixed'),
          popper: getLayoutRect(popper)
        }; // Modifiers have the ability to reset the current update cycle. The
        // most common use case for this is the `flip` modifier changing the
        // placement, which then needs to re-run all the modifiers, because the
        // logic was previously ran for the previous placement and is therefore
        // stale/incorrect

        state.reset = false;
        state.placement = state.options.placement; // On each update cycle, the `modifiersData` property for each modifier
        // is filled with the initial data specified by the modifier. This means
        // it doesn't persist and is fresh on each update.
        // To ensure persistent data, use `${name}#persistent`

        state.orderedModifiers.forEach(function (modifier) {
          return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
        });
        var __debug_loops__ = 0;

        for (var index = 0; index < state.orderedModifiers.length; index++) {
          if (process.env.NODE_ENV !== "production") {
            __debug_loops__ += 1;

            if (__debug_loops__ > 100) {
              console.error(INFINITE_LOOP_ERROR);
              break;
            }
          }

          if (state.reset === true) {
            state.reset = false;
            index = -1;
            continue;
          }

          var _state$orderedModifie = state.orderedModifiers[index],
              fn = _state$orderedModifie.fn,
              _state$orderedModifie2 = _state$orderedModifie.options,
              _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2,
              name = _state$orderedModifie.name;

          if (typeof fn === 'function') {
            state = fn({
              state: state,
              options: _options,
              name: name,
              instance: instance
            }) || state;
          }
        }
      },
      // Async and optimistically optimized update – it will not be executed if
      // not necessary (debounced to run at most once-per-tick)
      update: debounce(function () {
        return new Promise(function (resolve) {
          instance.forceUpdate();
          resolve(state);
        });
      }),
      destroy: function destroy() {
        cleanupModifierEffects();
        isDestroyed = true;
      }
    };

    if (!areValidElements(reference, popper)) {
      if (process.env.NODE_ENV !== "production") {
        console.error(INVALID_ELEMENT_ERROR);
      }

      return instance;
    }

    instance.setOptions(options).then(function (state) {
      if (!isDestroyed && options.onFirstUpdate) {
        options.onFirstUpdate(state);
      }
    }); // Modifiers have the ability to execute arbitrary code before the first
    // update cycle runs. They will be executed in the same order as the update
    // cycle. This is useful when a modifier adds some persistent data that
    // other modifiers need to use, but the modifier is run after the dependent
    // one.

    function runModifierEffects() {
      state.orderedModifiers.forEach(function (_ref3) {
        var name = _ref3.name,
            _ref3$options = _ref3.options,
            options = _ref3$options === void 0 ? {} : _ref3$options,
            effect = _ref3.effect;

        if (typeof effect === 'function') {
          var cleanupFn = effect({
            state: state,
            name: name,
            instance: instance,
            options: options
          });

          var noopFn = function noopFn() {};

          effectCleanupFns.push(cleanupFn || noopFn);
        }
      });
    }

    function cleanupModifierEffects() {
      effectCleanupFns.forEach(function (fn) {
        return fn();
      });
      effectCleanupFns = [];
    }

    return instance;
  };
}

var defaultModifiers = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1, offset$1, flip$1, preventOverflow$1, arrow$1, hide$1];
var createPopper = /*#__PURE__*/popperGenerator({
  defaultModifiers: defaultModifiers
}); // eslint-disable-next-line import/no-unused-modules

/* src/popover/Popover.svelte generated by Svelte v3.44.2 */
const get_title_slot_changes = dirty => ({});
const get_title_slot_context = ctx => ({});

// (97:0) {#if isOpen}
function create_if_block(ctx) {
	let span1;
	let div;
	let t0;
	let t1;
	let span0;
	let span1_class_value;
	let current;
	let if_block = /*$$slots*/ ctx[3]['title'] && create_if_block_1(ctx);
	const default_slot_template = /*#slots*/ ctx[11].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

	return {
		c() {
			span1 = element("span");
			div = element("div");
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			span0 = element("span");
			if (default_slot) default_slot.c();
			attr(div, "data-popper-arrow", "");
			attr(div, "class", "arrow svelte-153u931");
			attr(span1, "data-show", /*isOpen*/ ctx[0]);
			attr(span1, "role", "tooltip");
			attr(span1, "class", span1_class_value = "bg-base-200 border border-opacity-50 border-base-content rounded p-1 " + /*className*/ ctx[1] + " svelte-153u931");
		},
		m(target, anchor) {
			insert(target, span1, anchor);
			append(span1, div);
			append(span1, t0);
			if (if_block) if_block.m(span1, null);
			append(span1, t1);
			append(span1, span0);

			if (default_slot) {
				default_slot.m(span0, null);
			}

			/*span1_binding*/ ctx[12](span1);
			current = true;
		},
		p(ctx, dirty) {
			if (/*$$slots*/ ctx[3]['title']) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*$$slots*/ 8) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(span1, t1);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[10],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*isOpen*/ 1) {
				attr(span1, "data-show", /*isOpen*/ ctx[0]);
			}

			if (!current || dirty & /*className*/ 2 && span1_class_value !== (span1_class_value = "bg-base-200 border border-opacity-50 border-base-content rounded p-1 " + /*className*/ ctx[1] + " svelte-153u931")) {
				attr(span1, "class", span1_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(span1);
			if (if_block) if_block.d();
			if (default_slot) default_slot.d(detaching);
			/*span1_binding*/ ctx[12](null);
		}
	};
}

// (104:2) {#if $$slots['title']}
function create_if_block_1(ctx) {
	let span;
	let current;
	const title_slot_template = /*#slots*/ ctx[11].title;
	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[10], get_title_slot_context);

	return {
		c() {
			span = element("span");
			if (title_slot) title_slot.c();
			attr(span, "class", "w-full bg-gray-100 font-bold py-2 px-8");
		},
		m(target, anchor) {
			insert(target, span, anchor);

			if (title_slot) {
				title_slot.m(span, null);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (title_slot) {
				if (title_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
					update_slot_base(
						title_slot,
						title_slot_template,
						ctx,
						/*$$scope*/ ctx[10],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
						: get_slot_changes(title_slot_template, /*$$scope*/ ctx[10], dirty, get_title_slot_changes),
						get_title_slot_context
					);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(title_slot, local);
			current = true;
		},
		o(local) {
			transition_out(title_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(span);
			if (title_slot) title_slot.d(detaching);
		}
	};
}

function create_fragment$4(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*isOpen*/ ctx[0] && create_if_block(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*isOpen*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*isOpen*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	const $$slots = compute_slots(slots);
	let { class: className = '' } = $$props;
	let { open: isOpen = false } = $$props;
	let popper = null;
	let content;
	let targetElement;
	let { target } = $$props;
	let { hover = false } = $$props;
	let { focus = false } = $$props;
	let { placement = 'bottom' } = $$props;
	const toggle = () => $$invalidate(0, isOpen = !isOpen);
	const open = () => $$invalidate(0, isOpen = true);
	const close = () => $$invalidate(0, isOpen = false);

	onMount(() => {
		$$invalidate(9, targetElement = document.getElementById(target));

		if (targetElement) {
			if (hover) {
				targetElement.addEventListener('mouseenter', open);
				targetElement.addEventListener('mouseleave', close);
			} else if (focus) {
				targetElement.addEventListener('focus', open);
				targetElement.addEventListener('blur', close);
			} else {
				targetElement.addEventListener('click', toggle);
			}
		} else {
			throw new Error('popover needs a target element!');
		}

		return () => {
			if (targetElement) {
				if (hover) {
					targetElement.removeEventListener('mouseenter', open);
					targetElement.removeEventListener('mouseleave', close);
				} else if (focus) {
					targetElement.removeEventListener('focus', open);
					targetElement.removeEventListener('blur', close);
				} else {
					targetElement.removeEventListener('click', toggle);
				}
			}
		};
	});

	function span1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			content = $$value;
			$$invalidate(2, content);
		});
	}

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(1, className = $$props.class);
		if ('open' in $$props) $$invalidate(0, isOpen = $$props.open);
		if ('target' in $$props) $$invalidate(4, target = $$props.target);
		if ('hover' in $$props) $$invalidate(5, hover = $$props.hover);
		if ('focus' in $$props) $$invalidate(6, focus = $$props.focus);
		if ('placement' in $$props) $$invalidate(7, placement = $$props.placement);
		if ('$$scope' in $$props) $$invalidate(10, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*isOpen, content, targetElement, placement, popper*/ 901) {
			{
				if (isOpen && content) {
					$$invalidate(8, popper = createPopper(targetElement, content, {
						placement,
						modifiers: [
							{
								name: 'offset',
								options: { offset: [0, 8] }
							}
						]
					}));
				} else if (popper) {
					popper.destroy();
					$$invalidate(8, popper = undefined);
				}
			}
		}
	};

	return [
		isOpen,
		className,
		content,
		$$slots,
		target,
		hover,
		focus,
		placement,
		popper,
		targetElement,
		$$scope,
		slots,
		span1_binding
	];
}

class Popover extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$3, create_fragment$4, safe_not_equal, {
			class: 1,
			open: 0,
			target: 4,
			hover: 5,
			focus: 6,
			placement: 7
		});
	}
}

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = new Set();
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (const subscriber of subscribers) {
                    subscriber[1]();
                    subscriber_queue.push(subscriber, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

/* src/tab/TabContent.svelte generated by Svelte v3.44.2 */

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[14] = list[i].name;
	child_ctx[15] = list[i].disabled;
	return child_ctx;
}

// (52:2) {#each names as { name, disabled }}
function create_each_block$2(ctx) {
	let div;
	let t_value = /*name*/ ctx[14] + "";
	let t;
	let div_class_value;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[13](/*disabled*/ ctx[15], /*name*/ ctx[14]);
	}

	return {
		c() {
			div = element("div");
			t = text(t_value);
			attr(div, "class", div_class_value = "tab tab-" + /*size*/ ctx[3] + " " + /*borderedClasses*/ ctx[6] + " " + /*liftedClasses*/ ctx[5]);
			toggle_class(div, "tab-active", /*name*/ ctx[14] === /*$activeTab*/ ctx[7]);
			toggle_class(div, "hover:text-gray-500", /*disabled*/ ctx[15]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);

			if (!mounted) {
				dispose = listen(div, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*names*/ 16 && t_value !== (t_value = /*name*/ ctx[14] + "")) set_data(t, t_value);

			if (dirty & /*size, borderedClasses, liftedClasses*/ 104 && div_class_value !== (div_class_value = "tab tab-" + /*size*/ ctx[3] + " " + /*borderedClasses*/ ctx[6] + " " + /*liftedClasses*/ ctx[5])) {
				attr(div, "class", div_class_value);
			}

			if (dirty & /*size, borderedClasses, liftedClasses, names, $activeTab*/ 248) {
				toggle_class(div, "tab-active", /*name*/ ctx[14] === /*$activeTab*/ ctx[7]);
			}

			if (dirty & /*size, borderedClasses, liftedClasses, names*/ 120) {
				toggle_class(div, "hover:text-gray-500", /*disabled*/ ctx[15]);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$3(ctx) {
	let div3;
	let div1;
	let t0;
	let div0;
	let div0_class_value;
	let t1;
	let div2;
	let div3_class_value;
	let current;
	let each_value = /*names*/ ctx[4];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	const default_slot_template = /*#slots*/ ctx[12].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

	return {
		c() {
			div3 = element("div");
			div1 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t0 = space();
			div0 = element("div");
			t1 = space();
			div2 = element("div");
			if (default_slot) default_slot.c();
			attr(div0, "class", div0_class_value = "" + (/*liftedClasses*/ ctx[5] + " " + /*borderedClasses*/ ctx[6] + " flex-1"));
			attr(div1, "class", "tabs mb-1 mr-1");
			toggle_class(div1, "flex-col", /*vertical*/ ctx[1]);
			toggle_class(div1, "tabs-boxed", /*boxed*/ ctx[2]);
			attr(div2, "class", "flex-1");
			attr(div3, "class", div3_class_value = "flex " + /*className*/ ctx[0]);
			toggle_class(div3, "flex-col", !/*vertical*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div1, null);
			}

			append(div1, t0);
			append(div1, div0);
			append(div3, t1);
			append(div3, div2);

			if (default_slot) {
				default_slot.m(div2, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*size, borderedClasses, liftedClasses, names, $activeTab, activeTab*/ 504) {
				each_value = /*names*/ ctx[4];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div1, t0);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (!current || dirty & /*liftedClasses, borderedClasses*/ 96 && div0_class_value !== (div0_class_value = "" + (/*liftedClasses*/ ctx[5] + " " + /*borderedClasses*/ ctx[6] + " flex-1"))) {
				attr(div0, "class", div0_class_value);
			}

			if (dirty & /*vertical*/ 2) {
				toggle_class(div1, "flex-col", /*vertical*/ ctx[1]);
			}

			if (dirty & /*boxed*/ 4) {
				toggle_class(div1, "tabs-boxed", /*boxed*/ ctx[2]);
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[11],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1 && div3_class_value !== (div3_class_value = "flex " + /*className*/ ctx[0])) {
				attr(div3, "class", div3_class_value);
			}

			if (dirty & /*className, vertical*/ 3) {
				toggle_class(div3, "flex-col", !/*vertical*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div3);
			destroy_each(each_blocks, detaching);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let borderedClasses;
	let liftedClasses;
	let $activeTab;
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let { vertical = false } = $$props;
	let { boxed = false } = $$props;
	let { lifted = false } = $$props;
	let { bordered = false } = $$props;
	let { size = 'md' } = $$props;
	let names = [];
	let activeTab = writable();
	component_subscribe($$self, activeTab, value => $$invalidate(7, $activeTab = value));

	setContext('tabContent', {
		addNewTab: ({ name, active, disabled }) => {
			$$invalidate(4, names = [...names, { name, disabled }]);
			if (names.length === 1) activeTab.set(name);
			if (active) activeTab.set(name);
		},
		activeTab
	});

	const click_handler = (disabled, name) => {
		if (!disabled) activeTab.set(name);
	};

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('vertical' in $$props) $$invalidate(1, vertical = $$props.vertical);
		if ('boxed' in $$props) $$invalidate(2, boxed = $$props.boxed);
		if ('lifted' in $$props) $$invalidate(9, lifted = $$props.lifted);
		if ('bordered' in $$props) $$invalidate(10, bordered = $$props.bordered);
		if ('size' in $$props) $$invalidate(3, size = $$props.size);
		if ('$$scope' in $$props) $$invalidate(11, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*bordered, vertical*/ 1026) {
			$$invalidate(6, borderedClasses = bordered && !vertical ? 'tab-bordered' : '');
		}

		if ($$self.$$.dirty & /*lifted, vertical*/ 514) {
			$$invalidate(5, liftedClasses = lifted && !vertical ? 'tab-lifted' : '');
		}
	};

	return [
		className,
		vertical,
		boxed,
		size,
		names,
		liftedClasses,
		borderedClasses,
		$activeTab,
		activeTab,
		lifted,
		bordered,
		$$scope,
		slots,
		click_handler
	];
}

class TabContent extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$2, create_fragment$3, safe_not_equal, {
			class: 0,
			vertical: 1,
			boxed: 2,
			lifted: 9,
			bordered: 10,
			size: 3
		});
	}
}

/* src/tab/TabPane.svelte generated by Svelte v3.44.2 */

function create_fragment$2(ctx) {
	let div;
	let current;
	const default_slot_template = /*#slots*/ ctx[7].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", /*className*/ ctx[0]);
			toggle_class(div, "hidden", /*$activeTab*/ ctx[2] !== /*name*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[6],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*className*/ 1) {
				attr(div, "class", /*className*/ ctx[0]);
			}

			if (dirty & /*className, $activeTab, name*/ 7) {
				toggle_class(div, "hidden", /*$activeTab*/ ctx[2] !== /*name*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let $activeTab;
	let { $$slots: slots = {}, $$scope } = $$props;
	let { class: className = '' } = $$props;
	let tabContent = getContext('tabContent');
	let activeTab = tabContent.activeTab;
	component_subscribe($$self, activeTab, value => $$invalidate(2, $activeTab = value));
	let { name = undefined } = $$props;
	let { active = false } = $$props;
	let { disabled = false } = $$props;

	onMount(() => {
		tabContent.addNewTab({ name, active, disabled });
	});

	$$self.$$set = $$props => {
		if ('class' in $$props) $$invalidate(0, className = $$props.class);
		if ('name' in $$props) $$invalidate(1, name = $$props.name);
		if ('active' in $$props) $$invalidate(4, active = $$props.active);
		if ('disabled' in $$props) $$invalidate(5, disabled = $$props.disabled);
		if ('$$scope' in $$props) $$invalidate(6, $$scope = $$props.$$scope);
	};

	return [className, name, $activeTab, activeTab, active, disabled, $$scope, slots];
}

class TabPane extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$1, create_fragment$2, safe_not_equal, {
			class: 0,
			name: 1,
			active: 4,
			disabled: 5
		});
	}
}

/* example/src/components/Alert.svelte generated by Svelte v3.44.2 */

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[0] = list[i];
	return child_ctx;
}

// (7:8) <Alert open {variant}>
function create_default_slot$1(ctx) {
	let t;

	return {
		c() {
			t = text("This is content of alert");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (8:12) <svelte:fragment slot="title">
function create_title_slot$1(ctx) {
	let t0;
	let t1;

	return {
		c() {
			t0 = text("Alert - ");
			t1 = text(/*variant*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, t1, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(t1);
		}
	};
}

// (5:4) {#each ['info', 'success', 'error', 'warning'] as variant}
function create_each_block$1(ctx) {
	let div;
	let alert;
	let t;
	let current;

	alert = new Alert({
			props: {
				open: true,
				variant: /*variant*/ ctx[0],
				$$slots: {
					title: [create_title_slot$1],
					default: [create_default_slot$1]
				},
				$$scope: { ctx }
			}
		});

	return {
		c() {
			div = element("div");
			create_component(alert.$$.fragment);
			t = space();
			attr(div, "class", "p-2");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(alert, div, null);
			append(div, t);
			current = true;
		},
		p(ctx, dirty) {
			const alert_changes = {};

			if (dirty & /*$$scope*/ 8) {
				alert_changes.$$scope = { dirty, ctx };
			}

			alert.$set(alert_changes);
		},
		i(local) {
			if (current) return;
			transition_in(alert.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(alert.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(alert);
		}
	};
}

function create_fragment$1(ctx) {
	let div;
	let current;
	let each_value = ['info', 'success', 'error', 'warning'];
	let each_blocks = [];

	for (let i = 0; i < 4; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	return {
		c() {
			div = element("div");

			for (let i = 0; i < 4; i += 1) {
				each_blocks[i].c();
			}

			attr(div, "class", "p-4 flex flex-col");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < 4; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;

			for (let i = 0; i < 4; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < 4; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
		}
	};
}

class Alert_1 extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$1, safe_not_equal, {});
	}
}

/* example/src/App.svelte generated by Svelte v3.44.2 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[8] = list[i];
	child_ctx[10] = i;
	return child_ctx;
}

// (35:10) <Button variant="ghost">
function create_default_slot_55(ctx) {
	let t;

	return {
		c() {
			t = text("Left");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (36:10) <Button variant="ghost">
function create_default_slot_54(ctx) {
	let t;

	return {
		c() {
			t = text("Another");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (34:5) <svelte:fragment slot="start">
function create_start_slot(ctx) {
	let button0;
	let t;
	let button1;
	let current;

	button0 = new Button({
			props: {
				variant: "ghost",
				$$slots: { default: [create_default_slot_55] },
				$$scope: { ctx }
			}
		});

	button1 = new Button({
			props: {
				variant: "ghost",
				$$slots: { default: [create_default_slot_54] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(button0.$$.fragment);
			t = space();
			create_component(button1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(button0, target, anchor);
			insert(target, t, anchor);
			mount_component(button1, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const button0_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button0_changes.$$scope = { dirty, ctx };
			}

			button0.$set(button0_changes);
			const button1_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button1_changes.$$scope = { dirty, ctx };
			}

			button1.$set(button1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(button0.$$.fragment, local);
			transition_in(button1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(button0, detaching);
			if (detaching) detach(t);
			destroy_component(button1, detaching);
		}
	};
}

// (39:5) <svelte:fragment slot="center">
function create_center_slot(ctx) {
	let t;

	return {
		c() {
			t = text("Svelte Components");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (43:5) <svelte:fragment slot="end">
function create_end_slot(ctx) {
	let t;

	return {
		c() {
			t = text("Right");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (56:0) <AvatarGroup size="lg">
function create_default_slot_53(ctx) {
	let avatar0;
	let t0;
	let avatar1;
	let t1;
	let avatar2;
	let current;

	avatar0 = new Avatar({
			props: {
				image: "/example/images/users/avatar-1.jpg"
			}
		});

	avatar1 = new Avatar({
			props: {
				image: "/example/images/users/avatar-1.jpg"
			}
		});

	avatar2 = new Avatar({
			props: {
				image: "/example/images/users/avatar-1.jpg"
			}
		});

	return {
		c() {
			create_component(avatar0.$$.fragment);
			t0 = space();
			create_component(avatar1.$$.fragment);
			t1 = space();
			create_component(avatar2.$$.fragment);
		},
		m(target, anchor) {
			mount_component(avatar0, target, anchor);
			insert(target, t0, anchor);
			mount_component(avatar1, target, anchor);
			insert(target, t1, anchor);
			mount_component(avatar2, target, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(avatar0.$$.fragment, local);
			transition_in(avatar1.$$.fragment, local);
			transition_in(avatar2.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(avatar0.$$.fragment, local);
			transition_out(avatar1.$$.fragment, local);
			transition_out(avatar2.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(avatar0, detaching);
			if (detaching) detach(t0);
			destroy_component(avatar1, detaching);
			if (detaching) detach(t1);
			destroy_component(avatar2, detaching);
		}
	};
}

// (64:0) <Badge variant="secondary">
function create_default_slot_52(ctx) {
	let t;

	return {
		c() {
			t = text("New");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (65:0) <Badge>
function create_default_slot_51(ctx) {
	let t;

	return {
		c() {
			t = text("prima ry");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (66:0) <Badge size="lg">
function create_default_slot_50(ctx) {
	let t;

	return {
		c() {
			t = text("lg");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (71:5) <BreadcrumbItem>
function create_default_slot_49(ctx) {
	let t;

	return {
		c() {
			t = text("Hello");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (72:5) <BreadcrumbItem>
function create_default_slot_48(ctx) {
	let t;

	return {
		c() {
			t = text("World");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (73:5) <BreadcrumbItem active>
function create_default_slot_47(ctx) {
	let t;

	return {
		c() {
			t = text("123");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (70:0) <Breadcrumb>
function create_default_slot_46(ctx) {
	let breadcrumbitem0;
	let t0;
	let breadcrumbitem1;
	let t1;
	let breadcrumbitem2;
	let current;

	breadcrumbitem0 = new BreadcrumbItem({
			props: {
				$$slots: { default: [create_default_slot_49] },
				$$scope: { ctx }
			}
		});

	breadcrumbitem1 = new BreadcrumbItem({
			props: {
				$$slots: { default: [create_default_slot_48] },
				$$scope: { ctx }
			}
		});

	breadcrumbitem2 = new BreadcrumbItem({
			props: {
				active: true,
				$$slots: { default: [create_default_slot_47] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(breadcrumbitem0.$$.fragment);
			t0 = space();
			create_component(breadcrumbitem1.$$.fragment);
			t1 = space();
			create_component(breadcrumbitem2.$$.fragment);
		},
		m(target, anchor) {
			mount_component(breadcrumbitem0, target, anchor);
			insert(target, t0, anchor);
			mount_component(breadcrumbitem1, target, anchor);
			insert(target, t1, anchor);
			mount_component(breadcrumbitem2, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const breadcrumbitem0_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				breadcrumbitem0_changes.$$scope = { dirty, ctx };
			}

			breadcrumbitem0.$set(breadcrumbitem0_changes);
			const breadcrumbitem1_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				breadcrumbitem1_changes.$$scope = { dirty, ctx };
			}

			breadcrumbitem1.$set(breadcrumbitem1_changes);
			const breadcrumbitem2_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				breadcrumbitem2_changes.$$scope = { dirty, ctx };
			}

			breadcrumbitem2.$set(breadcrumbitem2_changes);
		},
		i(local) {
			if (current) return;
			transition_in(breadcrumbitem0.$$.fragment, local);
			transition_in(breadcrumbitem1.$$.fragment, local);
			transition_in(breadcrumbitem2.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(breadcrumbitem0.$$.fragment, local);
			transition_out(breadcrumbitem1.$$.fragment, local);
			transition_out(breadcrumbitem2.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(breadcrumbitem0, detaching);
			if (detaching) detach(t0);
			destroy_component(breadcrumbitem1, detaching);
			if (detaching) detach(t1);
			destroy_component(breadcrumbitem2, detaching);
		}
	};
}

// (78:0) <Button class="m-2" variant="secondary">
function create_default_slot_45(ctx) {
	let t;

	return {
		c() {
			t = text("Secondary");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (79:0) <Button class="m-2" size="sm" variant="accent">
function create_default_slot_44(ctx) {
	let t;

	return {
		c() {
			t = text("Small");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (80:0) <Button class="m-2" wide>
function create_default_slot_43(ctx) {
	let t;

	return {
		c() {
			t = text("wide");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (83:5) <Button>
function create_default_slot_42(ctx) {
	let t;

	return {
		c() {
			t = text("Easy");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (84:5) <Button active>
function create_default_slot_41(ctx) {
	let t;

	return {
		c() {
			t = text("Medium");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (85:5) <Button>
function create_default_slot_40(ctx) {
	let t;

	return {
		c() {
			t = text("Hard");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (82:0) <ButtonGroup class="m-2" size="lg">
function create_default_slot_39(ctx) {
	let button0;
	let t0;
	let button1;
	let t1;
	let button2;
	let current;

	button0 = new Button({
			props: {
				$$slots: { default: [create_default_slot_42] },
				$$scope: { ctx }
			}
		});

	button1 = new Button({
			props: {
				active: true,
				$$slots: { default: [create_default_slot_41] },
				$$scope: { ctx }
			}
		});

	button2 = new Button({
			props: {
				$$slots: { default: [create_default_slot_40] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(button0.$$.fragment);
			t0 = space();
			create_component(button1.$$.fragment);
			t1 = space();
			create_component(button2.$$.fragment);
		},
		m(target, anchor) {
			mount_component(button0, target, anchor);
			insert(target, t0, anchor);
			mount_component(button1, target, anchor);
			insert(target, t1, anchor);
			mount_component(button2, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const button0_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button0_changes.$$scope = { dirty, ctx };
			}

			button0.$set(button0_changes);
			const button1_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button1_changes.$$scope = { dirty, ctx };
			}

			button1.$set(button1_changes);
			const button2_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button2_changes.$$scope = { dirty, ctx };
			}

			button2.$set(button2_changes);
		},
		i(local) {
			if (current) return;
			transition_in(button0.$$.fragment, local);
			transition_in(button1.$$.fragment, local);
			transition_in(button2.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			transition_out(button2.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(button0, detaching);
			if (detaching) detach(t0);
			destroy_component(button1, detaching);
			if (detaching) detach(t1);
			destroy_component(button2, detaching);
		}
	};
}

// (92:10) <CarouselItem class="m-1 rounded-box shadow overflow-hidden">
function create_default_slot_38(ctx) {
	let img;
	let img_src_value;
	let t;

	return {
		c() {
			img = element("img");
			t = space();
			attr(img, "class", "max-w-sm");
			attr(img, "alt", "carousel " + /*index*/ ctx[10]);
			if (!src_url_equal(img.src, img_src_value = "/example/images/small/img-" + (/*index*/ ctx[10] + 1) + ".jpg")) attr(img, "src", img_src_value);
		},
		m(target, anchor) {
			insert(target, img, anchor);
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(img);
			if (detaching) detach(t);
		}
	};
}

// (91:5) {#each Array.from({length: 7}).fill(0) as item, index}
function create_each_block(ctx) {
	let carouselitem;
	let current;

	carouselitem = new CarouselItem({
			props: {
				class: "m-1 rounded-box shadow overflow-hidden",
				$$slots: { default: [create_default_slot_38] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(carouselitem.$$.fragment);
		},
		m(target, anchor) {
			mount_component(carouselitem, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const carouselitem_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				carouselitem_changes.$$scope = { dirty, ctx };
			}

			carouselitem.$set(carouselitem_changes);
		},
		i(local) {
			if (current) return;
			transition_in(carouselitem.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(carouselitem.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(carouselitem, detaching);
		}
	};
}

// (90:0) <Carousel class="max-w-md" center>
function create_default_slot_37(ctx) {
	let each_1_anchor;
	let current;
	let each_value = Array.from({ length: 7 }).fill(0);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (104:0) <Card>
function create_default_slot_36(ctx) {
	let t;

	return {
		c() {
			t = text("this is content of card");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (105:5) <CardTitle slot="title">
function create_default_slot_35(ctx) {
	let t;

	return {
		c() {
			t = text("Card Title");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (105:5) 
function create_title_slot_2(ctx) {
	let cardtitle;
	let current;

	cardtitle = new CardTitle({
			props: {
				slot: "title",
				$$slots: { default: [create_default_slot_35] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(cardtitle.$$.fragment);
		},
		m(target, anchor) {
			mount_component(cardtitle, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const cardtitle_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				cardtitle_changes.$$scope = { dirty, ctx };
			}

			cardtitle.$set(cardtitle_changes);
		},
		i(local) {
			if (current) return;
			transition_in(cardtitle.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(cardtitle.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(cardtitle, detaching);
		}
	};
}

// (106:5) <CardActions slot="actions">
function create_default_slot_34(ctx) {
	let div0;
	let t1;
	let div1;

	return {
		c() {
			div0 = element("div");
			div0.textContent = "Action 1";
			t1 = space();
			div1 = element("div");
			div1.textContent = "Action 2";
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			insert(target, t1, anchor);
			insert(target, div1, anchor);
		},
		d(detaching) {
			if (detaching) detach(div0);
			if (detaching) detach(t1);
			if (detaching) detach(div1);
		}
	};
}

// (106:5) 
function create_actions_slot_1(ctx) {
	let cardactions;
	let current;

	cardactions = new CardActions({
			props: {
				slot: "actions",
				$$slots: { default: [create_default_slot_34] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(cardactions.$$.fragment);
		},
		m(target, anchor) {
			mount_component(cardactions, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const cardactions_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				cardactions_changes.$$scope = { dirty, ctx };
			}

			cardactions.$set(cardactions_changes);
		},
		i(local) {
			if (current) return;
			transition_in(cardactions.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(cardactions.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(cardactions, detaching);
		}
	};
}

// (112:0) <Divider vertical>
function create_default_slot_33(ctx) {
	let t;

	return {
		c() {
			t = text("VS");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (114:0) <Card shadow position="full">
function create_default_slot_32(ctx) {
	let t;

	return {
		c() {
			t = text("this is content of card");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (115:5) <CardTitle slot="title">
function create_default_slot_31(ctx) {
	let t;

	return {
		c() {
			t = text("Another Card");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (115:5) 
function create_title_slot_1(ctx) {
	let cardtitle;
	let current;

	cardtitle = new CardTitle({
			props: {
				slot: "title",
				$$slots: { default: [create_default_slot_31] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(cardtitle.$$.fragment);
		},
		m(target, anchor) {
			mount_component(cardtitle, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const cardtitle_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				cardtitle_changes.$$scope = { dirty, ctx };
			}

			cardtitle.$set(cardtitle_changes);
		},
		i(local) {
			if (current) return;
			transition_in(cardtitle.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(cardtitle.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(cardtitle, detaching);
		}
	};
}

// (116:5) <CardActions slot="actions">
function create_default_slot_30(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			div.textContent = "Action";
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (116:5) 
function create_actions_slot(ctx) {
	let cardactions;
	let current;

	cardactions = new CardActions({
			props: {
				slot: "actions",
				$$slots: { default: [create_default_slot_30] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(cardactions.$$.fragment);
		},
		m(target, anchor) {
			mount_component(cardactions, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const cardactions_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				cardactions_changes.$$scope = { dirty, ctx };
			}

			cardactions.$set(cardactions_changes);
		},
		i(local) {
			if (current) return;
			transition_in(cardactions.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(cardactions.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(cardactions, detaching);
		}
	};
}

// (120:5) 
function create_image_slot(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			attr(img, "class", "max-w-sm");
			attr(img, "slot", "image");
			if (!src_url_equal(img.src, img_src_value = "/example/images/small/img-1.jpg")) attr(img, "src", img_src_value);
			attr(img, "alt", "test");
		},
		m(target, anchor) {
			insert(target, img, anchor);
		},
		d(detaching) {
			if (detaching) detach(img);
		}
	};
}

// (132:0) <Button on:click={() => drawerOpen = true}>
function create_default_slot_29(ctx) {
	let t;

	return {
		c() {
			t = text("Open Drawer");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (133:0) <Drawer position="right" bind:show={drawerOpen}>
function create_default_slot_28(ctx) {
	let t;

	return {
		c() {
			t = text("This should open from right side");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (139:0) <Dropdown position="right" class="menu">
function create_default_slot_27(ctx) {
	let t0;
	let ul;

	return {
		c() {
			t0 = text("// TODO: fix this after adding Menu and MenuItem components\n     \n     ");
			ul = element("ul");

			ul.innerHTML = `<li><a href="#">Item 1</a></li> 
          <li><a href="#">Item 2</a></li> 
          <li><a href="#">Item 3</a></li>`;

			attr(ul, "class", "menu w-56 bg-base-100 text-base-content");
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, ul, anchor);
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(ul);
		}
	};
}

// (141:5) <svelte:fragment slot="title">
function create_title_slot(ctx) {
	let t;

	return {
		c() {
			t = text("Dropdown");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (157:0) <Link hover href="#">
function create_default_slot_26(ctx) {
	let t;

	return {
		c() {
			t = text("top");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (164:5) <MenuTitle>
function create_default_slot_25(ctx) {
	let t;

	return {
		c() {
			t = text("first");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (165:5) <MenuItem>
function create_default_slot_24(ctx) {
	let t;

	return {
		c() {
			t = text("Item 1");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (166:5) <MenuItem>
function create_default_slot_23(ctx) {
	let t;

	return {
		c() {
			t = text("Item 2");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (167:5) <MenuTitle>
function create_default_slot_22(ctx) {
	let t;

	return {
		c() {
			t = text("second");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (168:5) <MenuItem>
function create_default_slot_21(ctx) {
	let t;

	return {
		c() {
			t = text("Item 3");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (169:5) <MenuItem>
function create_default_slot_20(ctx) {
	let t;

	return {
		c() {
			t = text("Item 4");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (170:5) <MenuItem>
function create_default_slot_19(ctx) {
	let t;

	return {
		c() {
			t = text("Item 5");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (163:0) <Menu class="m-2 w-80 bg-gray-200" rounded compact>
function create_default_slot_18(ctx) {
	let menutitle0;
	let t0;
	let menuitem0;
	let t1;
	let menuitem1;
	let t2;
	let menutitle1;
	let t3;
	let menuitem2;
	let t4;
	let menuitem3;
	let t5;
	let menuitem4;
	let current;

	menutitle0 = new MenuTitle({
			props: {
				$$slots: { default: [create_default_slot_25] },
				$$scope: { ctx }
			}
		});

	menuitem0 = new MenuItem({
			props: {
				$$slots: { default: [create_default_slot_24] },
				$$scope: { ctx }
			}
		});

	menuitem1 = new MenuItem({
			props: {
				$$slots: { default: [create_default_slot_23] },
				$$scope: { ctx }
			}
		});

	menutitle1 = new MenuTitle({
			props: {
				$$slots: { default: [create_default_slot_22] },
				$$scope: { ctx }
			}
		});

	menuitem2 = new MenuItem({
			props: {
				$$slots: { default: [create_default_slot_21] },
				$$scope: { ctx }
			}
		});

	menuitem3 = new MenuItem({
			props: {
				$$slots: { default: [create_default_slot_20] },
				$$scope: { ctx }
			}
		});

	menuitem4 = new MenuItem({
			props: {
				$$slots: { default: [create_default_slot_19] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(menutitle0.$$.fragment);
			t0 = space();
			create_component(menuitem0.$$.fragment);
			t1 = space();
			create_component(menuitem1.$$.fragment);
			t2 = space();
			create_component(menutitle1.$$.fragment);
			t3 = space();
			create_component(menuitem2.$$.fragment);
			t4 = space();
			create_component(menuitem3.$$.fragment);
			t5 = space();
			create_component(menuitem4.$$.fragment);
		},
		m(target, anchor) {
			mount_component(menutitle0, target, anchor);
			insert(target, t0, anchor);
			mount_component(menuitem0, target, anchor);
			insert(target, t1, anchor);
			mount_component(menuitem1, target, anchor);
			insert(target, t2, anchor);
			mount_component(menutitle1, target, anchor);
			insert(target, t3, anchor);
			mount_component(menuitem2, target, anchor);
			insert(target, t4, anchor);
			mount_component(menuitem3, target, anchor);
			insert(target, t5, anchor);
			mount_component(menuitem4, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const menutitle0_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				menutitle0_changes.$$scope = { dirty, ctx };
			}

			menutitle0.$set(menutitle0_changes);
			const menuitem0_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				menuitem0_changes.$$scope = { dirty, ctx };
			}

			menuitem0.$set(menuitem0_changes);
			const menuitem1_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				menuitem1_changes.$$scope = { dirty, ctx };
			}

			menuitem1.$set(menuitem1_changes);
			const menutitle1_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				menutitle1_changes.$$scope = { dirty, ctx };
			}

			menutitle1.$set(menutitle1_changes);
			const menuitem2_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				menuitem2_changes.$$scope = { dirty, ctx };
			}

			menuitem2.$set(menuitem2_changes);
			const menuitem3_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				menuitem3_changes.$$scope = { dirty, ctx };
			}

			menuitem3.$set(menuitem3_changes);
			const menuitem4_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				menuitem4_changes.$$scope = { dirty, ctx };
			}

			menuitem4.$set(menuitem4_changes);
		},
		i(local) {
			if (current) return;
			transition_in(menutitle0.$$.fragment, local);
			transition_in(menuitem0.$$.fragment, local);
			transition_in(menuitem1.$$.fragment, local);
			transition_in(menutitle1.$$.fragment, local);
			transition_in(menuitem2.$$.fragment, local);
			transition_in(menuitem3.$$.fragment, local);
			transition_in(menuitem4.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(menutitle0.$$.fragment, local);
			transition_out(menuitem0.$$.fragment, local);
			transition_out(menuitem1.$$.fragment, local);
			transition_out(menutitle1.$$.fragment, local);
			transition_out(menuitem2.$$.fragment, local);
			transition_out(menuitem3.$$.fragment, local);
			transition_out(menuitem4.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(menutitle0, detaching);
			if (detaching) detach(t0);
			destroy_component(menuitem0, detaching);
			if (detaching) detach(t1);
			destroy_component(menuitem1, detaching);
			if (detaching) detach(t2);
			destroy_component(menutitle1, detaching);
			if (detaching) detach(t3);
			destroy_component(menuitem2, detaching);
			if (detaching) detach(t4);
			destroy_component(menuitem3, detaching);
			if (detaching) detach(t5);
			destroy_component(menuitem4, detaching);
		}
	};
}

// (175:0) <Button on:click={() => modalOpen = true}>
function create_default_slot_17(ctx) {
	let t;

	return {
		c() {
			t = text("Open Modal");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (179:10) <Button on:click={() => modalOpen = false}>
function create_default_slot_16(ctx) {
	let t;

	return {
		c() {
			t = text("Close");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (178:5) <ModalActions center>
function create_default_slot_15(ctx) {
	let button;
	let current;

	button = new Button({
			props: {
				$$slots: { default: [create_default_slot_16] },
				$$scope: { ctx }
			}
		});

	button.$on("click", /*click_handler_2*/ ctx[6]);

	return {
		c() {
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(button, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const button_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button_changes.$$scope = { dirty, ctx };
			}

			button.$set(button_changes);
		},
		i(local) {
			if (current) return;
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(button, detaching);
		}
	};
}

// (176:0) <Modal bind:open={modalOpen}>
function create_default_slot_14(ctx) {
	let t;
	let modalactions;
	let current;

	modalactions = new ModalActions({
			props: {
				center: true,
				$$slots: { default: [create_default_slot_15] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			t = text("Lorem, ipsum dolor sit amet consectetur adipisicinde leniti animi, ducimus provident quis. At fugit votate moll iquid molestias ipsam sed vel beatae optio ducimus.\n     ");
			create_component(modalactions.$$.fragment);
		},
		m(target, anchor) {
			insert(target, t, anchor);
			mount_component(modalactions, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const modalactions_changes = {};

			if (dirty & /*$$scope, modalOpen*/ 2050) {
				modalactions_changes.$$scope = { dirty, ctx };
			}

			modalactions.$set(modalactions_changes);
		},
		i(local) {
			if (current) return;
			transition_in(modalactions.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(modalactions.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t);
			destroy_component(modalactions, detaching);
		}
	};
}

// (185:5) <PaginationItem>
function create_default_slot_13(ctx) {
	let t;

	return {
		c() {
			t = text("Prev");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (186:5) <PaginationItem>
function create_default_slot_12(ctx) {
	let t;

	return {
		c() {
			t = text("1");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (187:5) <PaginationItem>
function create_default_slot_11(ctx) {
	let t;

	return {
		c() {
			t = text("2");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (188:5) <PaginationItem active>
function create_default_slot_10(ctx) {
	let t;

	return {
		c() {
			t = text("3");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (189:5) <PaginationItem>
function create_default_slot_9(ctx) {
	let t;

	return {
		c() {
			t = text("4");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (190:5) <PaginationItem>
function create_default_slot_8(ctx) {
	let t;

	return {
		c() {
			t = text("Next");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (184:0) <Pagination variant="secondary">
function create_default_slot_7(ctx) {
	let paginationitem0;
	let t0;
	let paginationitem1;
	let t1;
	let paginationitem2;
	let t2;
	let paginationitem3;
	let t3;
	let paginationitem4;
	let t4;
	let paginationitem5;
	let current;

	paginationitem0 = new PaginationItem({
			props: {
				$$slots: { default: [create_default_slot_13] },
				$$scope: { ctx }
			}
		});

	paginationitem1 = new PaginationItem({
			props: {
				$$slots: { default: [create_default_slot_12] },
				$$scope: { ctx }
			}
		});

	paginationitem2 = new PaginationItem({
			props: {
				$$slots: { default: [create_default_slot_11] },
				$$scope: { ctx }
			}
		});

	paginationitem3 = new PaginationItem({
			props: {
				active: true,
				$$slots: { default: [create_default_slot_10] },
				$$scope: { ctx }
			}
		});

	paginationitem4 = new PaginationItem({
			props: {
				$$slots: { default: [create_default_slot_9] },
				$$scope: { ctx }
			}
		});

	paginationitem5 = new PaginationItem({
			props: {
				$$slots: { default: [create_default_slot_8] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(paginationitem0.$$.fragment);
			t0 = space();
			create_component(paginationitem1.$$.fragment);
			t1 = space();
			create_component(paginationitem2.$$.fragment);
			t2 = space();
			create_component(paginationitem3.$$.fragment);
			t3 = space();
			create_component(paginationitem4.$$.fragment);
			t4 = space();
			create_component(paginationitem5.$$.fragment);
		},
		m(target, anchor) {
			mount_component(paginationitem0, target, anchor);
			insert(target, t0, anchor);
			mount_component(paginationitem1, target, anchor);
			insert(target, t1, anchor);
			mount_component(paginationitem2, target, anchor);
			insert(target, t2, anchor);
			mount_component(paginationitem3, target, anchor);
			insert(target, t3, anchor);
			mount_component(paginationitem4, target, anchor);
			insert(target, t4, anchor);
			mount_component(paginationitem5, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const paginationitem0_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				paginationitem0_changes.$$scope = { dirty, ctx };
			}

			paginationitem0.$set(paginationitem0_changes);
			const paginationitem1_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				paginationitem1_changes.$$scope = { dirty, ctx };
			}

			paginationitem1.$set(paginationitem1_changes);
			const paginationitem2_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				paginationitem2_changes.$$scope = { dirty, ctx };
			}

			paginationitem2.$set(paginationitem2_changes);
			const paginationitem3_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				paginationitem3_changes.$$scope = { dirty, ctx };
			}

			paginationitem3.$set(paginationitem3_changes);
			const paginationitem4_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				paginationitem4_changes.$$scope = { dirty, ctx };
			}

			paginationitem4.$set(paginationitem4_changes);
			const paginationitem5_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				paginationitem5_changes.$$scope = { dirty, ctx };
			}

			paginationitem5.$set(paginationitem5_changes);
		},
		i(local) {
			if (current) return;
			transition_in(paginationitem0.$$.fragment, local);
			transition_in(paginationitem1.$$.fragment, local);
			transition_in(paginationitem2.$$.fragment, local);
			transition_in(paginationitem3.$$.fragment, local);
			transition_in(paginationitem4.$$.fragment, local);
			transition_in(paginationitem5.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(paginationitem0.$$.fragment, local);
			transition_out(paginationitem1.$$.fragment, local);
			transition_out(paginationitem2.$$.fragment, local);
			transition_out(paginationitem3.$$.fragment, local);
			transition_out(paginationitem4.$$.fragment, local);
			transition_out(paginationitem5.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(paginationitem0, detaching);
			if (detaching) detach(t0);
			destroy_component(paginationitem1, detaching);
			if (detaching) detach(t1);
			destroy_component(paginationitem2, detaching);
			if (detaching) detach(t2);
			destroy_component(paginationitem3, detaching);
			if (detaching) detach(t3);
			destroy_component(paginationitem4, detaching);
			if (detaching) detach(t4);
			destroy_component(paginationitem5, detaching);
		}
	};
}

// (195:0) <Button id="pop-target">
function create_default_slot_6(ctx) {
	let t;

	return {
		c() {
			t = text("Open");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (196:0) <Popover target="pop-target">
function create_default_slot_5(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			div.textContent = "Hello from Popover";
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (204:5) <TabPane name="first">
function create_default_slot_4(ctx) {
	let t;

	return {
		c() {
			t = text("Hello World!");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (208:5) <TabPane name="second">
function create_default_slot_3(ctx) {
	let t;

	return {
		c() {
			t = text("Second Tab");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (212:5) <TabPane disabled name="disabled">
function create_default_slot_2(ctx) {
	let t;

	return {
		c() {
			t = text("You can't see this text");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (216:5) <TabPane name="third">
function create_default_slot_1(ctx) {
	let t;

	return {
		c() {
			t = text("another Tab");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (203:0) <TabContent bordered>
function create_default_slot(ctx) {
	let tabpane0;
	let t0;
	let tabpane1;
	let t1;
	let tabpane2;
	let t2;
	let tabpane3;
	let current;

	tabpane0 = new TabPane({
			props: {
				name: "first",
				$$slots: { default: [create_default_slot_4] },
				$$scope: { ctx }
			}
		});

	tabpane1 = new TabPane({
			props: {
				name: "second",
				$$slots: { default: [create_default_slot_3] },
				$$scope: { ctx }
			}
		});

	tabpane2 = new TabPane({
			props: {
				disabled: true,
				name: "disabled",
				$$slots: { default: [create_default_slot_2] },
				$$scope: { ctx }
			}
		});

	tabpane3 = new TabPane({
			props: {
				name: "third",
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(tabpane0.$$.fragment);
			t0 = space();
			create_component(tabpane1.$$.fragment);
			t1 = space();
			create_component(tabpane2.$$.fragment);
			t2 = space();
			create_component(tabpane3.$$.fragment);
		},
		m(target, anchor) {
			mount_component(tabpane0, target, anchor);
			insert(target, t0, anchor);
			mount_component(tabpane1, target, anchor);
			insert(target, t1, anchor);
			mount_component(tabpane2, target, anchor);
			insert(target, t2, anchor);
			mount_component(tabpane3, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const tabpane0_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				tabpane0_changes.$$scope = { dirty, ctx };
			}

			tabpane0.$set(tabpane0_changes);
			const tabpane1_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				tabpane1_changes.$$scope = { dirty, ctx };
			}

			tabpane1.$set(tabpane1_changes);
			const tabpane2_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				tabpane2_changes.$$scope = { dirty, ctx };
			}

			tabpane2.$set(tabpane2_changes);
			const tabpane3_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				tabpane3_changes.$$scope = { dirty, ctx };
			}

			tabpane3.$set(tabpane3_changes);
		},
		i(local) {
			if (current) return;
			transition_in(tabpane0.$$.fragment, local);
			transition_in(tabpane1.$$.fragment, local);
			transition_in(tabpane2.$$.fragment, local);
			transition_in(tabpane3.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(tabpane0.$$.fragment, local);
			transition_out(tabpane1.$$.fragment, local);
			transition_out(tabpane2.$$.fragment, local);
			transition_out(tabpane3.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(tabpane0, detaching);
			if (detaching) detach(t0);
			destroy_component(tabpane1, detaching);
			if (detaching) detach(t1);
			destroy_component(tabpane2, detaching);
			if (detaching) detach(t2);
			destroy_component(tabpane3, detaching);
		}
	};
}

function create_fragment(ctx) {
	let navbar;
	let t0;
	let alert;
	let t1;
	let card0;
	let t2;
	let avatar0;
	let t3;
	let avatar1;
	let t4;
	let avatargroup;
	let t5;
	let h10;
	let t7;
	let badge0;
	let t8;
	let badge1;
	let t9;
	let badge2;
	let t10;
	let h11;
	let t12;
	let breadcrumb;
	let t13;
	let h12;
	let t15;
	let button0;
	let t16;
	let button1;
	let t17;
	let button2;
	let t18;
	let buttongroup;
	let t19;
	let h13;
	let t21;
	let carousel;
	let t22;
	let h14;
	let t24;
	let div0;
	let card1;
	let t25;
	let divider0;
	let t26;
	let card2;
	let t27;
	let divider1;
	let t28;
	let h15;
	let t30;
	let countdown;
	let t31;
	let button3;
	let t32;
	let drawer;
	let updating_show;
	let t33;
	let h16;
	let t35;
	let dropdown;
	let t36;
	let h17;
	let t38;
	let image;
	let t39;
	let h18;
	let t41;
	let link;
	let t42;
	let h19;
	let t44;
	let menu;
	let t45;
	let h110;
	let t47;
	let button4;
	let t48;
	let modal;
	let updating_open;
	let t49;
	let h111;
	let t51;
	let pagination;
	let t52;
	let h112;
	let t54;
	let button5;
	let t55;
	let popover;
	let t56;
	let h113;
	let t58;
	let tabcontent;
	let t59;
	let div1;
	let current;

	navbar = new Navbar({
			props: {
				fixed: true,
				shadow: true,
				$$slots: {
					end: [create_end_slot],
					center: [create_center_slot],
					start: [create_start_slot]
				},
				$$scope: { ctx }
			}
		});

	alert = new Alert_1({});
	card0 = new Card({});

	avatar0 = new Avatar({
			props: { size: "sm", online: true, label: "SM" }
		});

	avatar1 = new Avatar({
			props: { size: "md", online: true, label: "MD" }
		});

	avatargroup = new AvatarGroup({
			props: {
				size: "lg",
				$$slots: { default: [create_default_slot_53] },
				$$scope: { ctx }
			}
		});

	badge0 = new Badge({
			props: {
				variant: "secondary",
				$$slots: { default: [create_default_slot_52] },
				$$scope: { ctx }
			}
		});

	badge1 = new Badge({
			props: {
				$$slots: { default: [create_default_slot_51] },
				$$scope: { ctx }
			}
		});

	badge2 = new Badge({
			props: {
				size: "lg",
				$$slots: { default: [create_default_slot_50] },
				$$scope: { ctx }
			}
		});

	breadcrumb = new Breadcrumb({
			props: {
				$$slots: { default: [create_default_slot_46] },
				$$scope: { ctx }
			}
		});

	button0 = new Button({
			props: {
				class: "m-2",
				variant: "secondary",
				$$slots: { default: [create_default_slot_45] },
				$$scope: { ctx }
			}
		});

	button1 = new Button({
			props: {
				class: "m-2",
				size: "sm",
				variant: "accent",
				$$slots: { default: [create_default_slot_44] },
				$$scope: { ctx }
			}
		});

	button2 = new Button({
			props: {
				class: "m-2",
				wide: true,
				$$slots: { default: [create_default_slot_43] },
				$$scope: { ctx }
			}
		});

	buttongroup = new ButtonGroup({
			props: {
				class: "m-2",
				size: "lg",
				$$slots: { default: [create_default_slot_39] },
				$$scope: { ctx }
			}
		});

	carousel = new Carousel({
			props: {
				class: "max-w-md",
				center: true,
				$$slots: { default: [create_default_slot_37] },
				$$scope: { ctx }
			}
		});

	card1 = new Card({
			props: {
				$$slots: {
					actions: [create_actions_slot_1],
					title: [create_title_slot_2],
					default: [create_default_slot_36]
				},
				$$scope: { ctx }
			}
		});

	divider0 = new Divider({
			props: {
				vertical: true,
				$$slots: { default: [create_default_slot_33] },
				$$scope: { ctx }
			}
		});

	card2 = new Card({
			props: {
				shadow: true,
				position: "full",
				$$slots: {
					image: [create_image_slot],
					actions: [create_actions_slot],
					title: [create_title_slot_1],
					default: [create_default_slot_32]
				},
				$$scope: { ctx }
			}
		});

	divider1 = new Divider({});

	countdown = new Countdown({
			props: {
				class: "p-6 m-4 bg-gray-900 rounded-box shadow text-neutral-content",
				value: /*count*/ ctx[2]
			}
		});

	button3 = new Button({
			props: {
				$$slots: { default: [create_default_slot_29] },
				$$scope: { ctx }
			}
		});

	button3.$on("click", /*click_handler*/ ctx[3]);

	function drawer_show_binding(value) {
		/*drawer_show_binding*/ ctx[4](value);
	}

	let drawer_props = {
		position: "right",
		$$slots: { default: [create_default_slot_28] },
		$$scope: { ctx }
	};

	if (/*drawerOpen*/ ctx[0] !== void 0) {
		drawer_props.show = /*drawerOpen*/ ctx[0];
	}

	drawer = new Drawer({ props: drawer_props });
	binding_callbacks.push(() => bind(drawer, 'show', drawer_show_binding));

	dropdown = new Dropdown({
			props: {
				position: "right",
				class: "menu",
				$$slots: {
					title: [create_title_slot],
					default: [create_default_slot_27]
				},
				$$scope: { ctx }
			}
		});

	image = new Image({
			props: {
				rounded: true,
				shadow: true,
				src: "/example/images/small/img-4.jpg",
				alt: "something"
			}
		});

	link = new Link({
			props: {
				hover: true,
				href: "#",
				$$slots: { default: [create_default_slot_26] },
				$$scope: { ctx }
			}
		});

	menu = new Menu({
			props: {
				class: "m-2 w-80 bg-gray-200",
				rounded: true,
				compact: true,
				$$slots: { default: [create_default_slot_18] },
				$$scope: { ctx }
			}
		});

	button4 = new Button({
			props: {
				$$slots: { default: [create_default_slot_17] },
				$$scope: { ctx }
			}
		});

	button4.$on("click", /*click_handler_1*/ ctx[5]);

	function modal_open_binding(value) {
		/*modal_open_binding*/ ctx[7](value);
	}

	let modal_props = {
		$$slots: { default: [create_default_slot_14] },
		$$scope: { ctx }
	};

	if (/*modalOpen*/ ctx[1] !== void 0) {
		modal_props.open = /*modalOpen*/ ctx[1];
	}

	modal = new Modal({ props: modal_props });
	binding_callbacks.push(() => bind(modal, 'open', modal_open_binding));

	pagination = new Pagination({
			props: {
				variant: "secondary",
				$$slots: { default: [create_default_slot_7] },
				$$scope: { ctx }
			}
		});

	button5 = new Button({
			props: {
				id: "pop-target",
				$$slots: { default: [create_default_slot_6] },
				$$scope: { ctx }
			}
		});

	popover = new Popover({
			props: {
				target: "pop-target",
				$$slots: { default: [create_default_slot_5] },
				$$scope: { ctx }
			}
		});

	tabcontent = new TabContent({
			props: {
				bordered: true,
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(navbar.$$.fragment);
			t0 = space();
			create_component(alert.$$.fragment);
			t1 = space();
			create_component(card0.$$.fragment);
			t2 = space();
			create_component(avatar0.$$.fragment);
			t3 = space();
			create_component(avatar1.$$.fragment);
			t4 = space();
			create_component(avatargroup.$$.fragment);
			t5 = space();
			h10 = element("h1");
			h10.textContent = "Badge";
			t7 = space();
			create_component(badge0.$$.fragment);
			t8 = space();
			create_component(badge1.$$.fragment);
			t9 = space();
			create_component(badge2.$$.fragment);
			t10 = space();
			h11 = element("h1");
			h11.textContent = "Breadcrumb";
			t12 = space();
			create_component(breadcrumb.$$.fragment);
			t13 = space();
			h12 = element("h1");
			h12.textContent = "Button";
			t15 = space();
			create_component(button0.$$.fragment);
			t16 = space();
			create_component(button1.$$.fragment);
			t17 = space();
			create_component(button2.$$.fragment);
			t18 = space();
			create_component(buttongroup.$$.fragment);
			t19 = space();
			h13 = element("h1");
			h13.textContent = "Carousel";
			t21 = space();
			create_component(carousel.$$.fragment);
			t22 = space();
			h14 = element("h1");
			h14.textContent = "Card";
			t24 = space();
			div0 = element("div");
			create_component(card1.$$.fragment);
			t25 = space();
			create_component(divider0.$$.fragment);
			t26 = space();
			create_component(card2.$$.fragment);
			t27 = space();
			create_component(divider1.$$.fragment);
			t28 = space();
			h15 = element("h1");
			h15.textContent = "Countdown";
			t30 = space();
			create_component(countdown.$$.fragment);
			t31 = space();
			create_component(button3.$$.fragment);
			t32 = space();
			create_component(drawer.$$.fragment);
			t33 = space();
			h16 = element("h1");
			h16.textContent = "Dropdown";
			t35 = space();
			create_component(dropdown.$$.fragment);
			t36 = space();
			h17 = element("h1");
			h17.textContent = "Image";
			t38 = space();
			create_component(image.$$.fragment);
			t39 = space();
			h18 = element("h1");
			h18.textContent = "Link";
			t41 = space();
			create_component(link.$$.fragment);
			t42 = space();
			h19 = element("h1");
			h19.textContent = "Menu";
			t44 = space();
			create_component(menu.$$.fragment);
			t45 = space();
			h110 = element("h1");
			h110.textContent = "Modal";
			t47 = space();
			create_component(button4.$$.fragment);
			t48 = space();
			create_component(modal.$$.fragment);
			t49 = space();
			h111 = element("h1");
			h111.textContent = "Pagination";
			t51 = space();
			create_component(pagination.$$.fragment);
			t52 = space();
			h112 = element("h1");
			h112.textContent = "Popover";
			t54 = space();
			create_component(button5.$$.fragment);
			t55 = space();
			create_component(popover.$$.fragment);
			t56 = space();
			h113 = element("h1");
			h113.textContent = "Tab";
			t58 = space();
			create_component(tabcontent.$$.fragment);
			t59 = space();
			div1 = element("div");
			div1.textContent = "Svelte App";
			attr(h10, "class", "text-lg m-2");
			attr(h11, "class", "text-lg m-2");
			attr(h12, "class", "text-lg m-2");
			attr(h13, "class", "text-lg m-2");
			attr(h14, "class", "text-lg m-2");
			attr(div0, "class", "flex space-x-2 space-y-2 flex-col sm:flex-row");
			attr(h15, "class", "text-lg font-bold");
			attr(h16, "class", "text-lg m-2");
			attr(h17, "class", "text-lg m-2");
			attr(h18, "class", "text-lg m-2");
			attr(h19, "class", "text-lg m-2");
			attr(h110, "class", "text-lg m-2");
			attr(h111, "class", "text-lg m-2");
			attr(h112, "class", "text-lg m-2");
			attr(h113, "class", "text-lg m-2");
			attr(div1, "class", "p-4 bg-gray-200 text-red-600");
		},
		m(target, anchor) {
			mount_component(navbar, target, anchor);
			insert(target, t0, anchor);
			mount_component(alert, target, anchor);
			insert(target, t1, anchor);
			mount_component(card0, target, anchor);
			insert(target, t2, anchor);
			mount_component(avatar0, target, anchor);
			insert(target, t3, anchor);
			mount_component(avatar1, target, anchor);
			insert(target, t4, anchor);
			mount_component(avatargroup, target, anchor);
			insert(target, t5, anchor);
			insert(target, h10, anchor);
			insert(target, t7, anchor);
			mount_component(badge0, target, anchor);
			insert(target, t8, anchor);
			mount_component(badge1, target, anchor);
			insert(target, t9, anchor);
			mount_component(badge2, target, anchor);
			insert(target, t10, anchor);
			insert(target, h11, anchor);
			insert(target, t12, anchor);
			mount_component(breadcrumb, target, anchor);
			insert(target, t13, anchor);
			insert(target, h12, anchor);
			insert(target, t15, anchor);
			mount_component(button0, target, anchor);
			insert(target, t16, anchor);
			mount_component(button1, target, anchor);
			insert(target, t17, anchor);
			mount_component(button2, target, anchor);
			insert(target, t18, anchor);
			mount_component(buttongroup, target, anchor);
			insert(target, t19, anchor);
			insert(target, h13, anchor);
			insert(target, t21, anchor);
			mount_component(carousel, target, anchor);
			insert(target, t22, anchor);
			insert(target, h14, anchor);
			insert(target, t24, anchor);
			insert(target, div0, anchor);
			mount_component(card1, div0, null);
			append(div0, t25);
			mount_component(divider0, div0, null);
			append(div0, t26);
			mount_component(card2, div0, null);
			insert(target, t27, anchor);
			mount_component(divider1, target, anchor);
			insert(target, t28, anchor);
			insert(target, h15, anchor);
			insert(target, t30, anchor);
			mount_component(countdown, target, anchor);
			insert(target, t31, anchor);
			mount_component(button3, target, anchor);
			insert(target, t32, anchor);
			mount_component(drawer, target, anchor);
			insert(target, t33, anchor);
			insert(target, h16, anchor);
			insert(target, t35, anchor);
			mount_component(dropdown, target, anchor);
			insert(target, t36, anchor);
			insert(target, h17, anchor);
			insert(target, t38, anchor);
			mount_component(image, target, anchor);
			insert(target, t39, anchor);
			insert(target, h18, anchor);
			insert(target, t41, anchor);
			mount_component(link, target, anchor);
			insert(target, t42, anchor);
			insert(target, h19, anchor);
			insert(target, t44, anchor);
			mount_component(menu, target, anchor);
			insert(target, t45, anchor);
			insert(target, h110, anchor);
			insert(target, t47, anchor);
			mount_component(button4, target, anchor);
			insert(target, t48, anchor);
			mount_component(modal, target, anchor);
			insert(target, t49, anchor);
			insert(target, h111, anchor);
			insert(target, t51, anchor);
			mount_component(pagination, target, anchor);
			insert(target, t52, anchor);
			insert(target, h112, anchor);
			insert(target, t54, anchor);
			mount_component(button5, target, anchor);
			insert(target, t55, anchor);
			mount_component(popover, target, anchor);
			insert(target, t56, anchor);
			insert(target, h113, anchor);
			insert(target, t58, anchor);
			mount_component(tabcontent, target, anchor);
			insert(target, t59, anchor);
			insert(target, div1, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const navbar_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				navbar_changes.$$scope = { dirty, ctx };
			}

			navbar.$set(navbar_changes);
			const avatargroup_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				avatargroup_changes.$$scope = { dirty, ctx };
			}

			avatargroup.$set(avatargroup_changes);
			const badge0_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				badge0_changes.$$scope = { dirty, ctx };
			}

			badge0.$set(badge0_changes);
			const badge1_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				badge1_changes.$$scope = { dirty, ctx };
			}

			badge1.$set(badge1_changes);
			const badge2_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				badge2_changes.$$scope = { dirty, ctx };
			}

			badge2.$set(badge2_changes);
			const breadcrumb_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				breadcrumb_changes.$$scope = { dirty, ctx };
			}

			breadcrumb.$set(breadcrumb_changes);
			const button0_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button0_changes.$$scope = { dirty, ctx };
			}

			button0.$set(button0_changes);
			const button1_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button1_changes.$$scope = { dirty, ctx };
			}

			button1.$set(button1_changes);
			const button2_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button2_changes.$$scope = { dirty, ctx };
			}

			button2.$set(button2_changes);
			const buttongroup_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				buttongroup_changes.$$scope = { dirty, ctx };
			}

			buttongroup.$set(buttongroup_changes);
			const carousel_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				carousel_changes.$$scope = { dirty, ctx };
			}

			carousel.$set(carousel_changes);
			const card1_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				card1_changes.$$scope = { dirty, ctx };
			}

			card1.$set(card1_changes);
			const divider0_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				divider0_changes.$$scope = { dirty, ctx };
			}

			divider0.$set(divider0_changes);
			const card2_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				card2_changes.$$scope = { dirty, ctx };
			}

			card2.$set(card2_changes);
			const countdown_changes = {};
			if (dirty & /*count*/ 4) countdown_changes.value = /*count*/ ctx[2];
			countdown.$set(countdown_changes);
			const button3_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button3_changes.$$scope = { dirty, ctx };
			}

			button3.$set(button3_changes);
			const drawer_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				drawer_changes.$$scope = { dirty, ctx };
			}

			if (!updating_show && dirty & /*drawerOpen*/ 1) {
				updating_show = true;
				drawer_changes.show = /*drawerOpen*/ ctx[0];
				add_flush_callback(() => updating_show = false);
			}

			drawer.$set(drawer_changes);
			const dropdown_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				dropdown_changes.$$scope = { dirty, ctx };
			}

			dropdown.$set(dropdown_changes);
			const link_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				link_changes.$$scope = { dirty, ctx };
			}

			link.$set(link_changes);
			const menu_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				menu_changes.$$scope = { dirty, ctx };
			}

			menu.$set(menu_changes);
			const button4_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button4_changes.$$scope = { dirty, ctx };
			}

			button4.$set(button4_changes);
			const modal_changes = {};

			if (dirty & /*$$scope, modalOpen*/ 2050) {
				modal_changes.$$scope = { dirty, ctx };
			}

			if (!updating_open && dirty & /*modalOpen*/ 2) {
				updating_open = true;
				modal_changes.open = /*modalOpen*/ ctx[1];
				add_flush_callback(() => updating_open = false);
			}

			modal.$set(modal_changes);
			const pagination_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				pagination_changes.$$scope = { dirty, ctx };
			}

			pagination.$set(pagination_changes);
			const button5_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				button5_changes.$$scope = { dirty, ctx };
			}

			button5.$set(button5_changes);
			const popover_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				popover_changes.$$scope = { dirty, ctx };
			}

			popover.$set(popover_changes);
			const tabcontent_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				tabcontent_changes.$$scope = { dirty, ctx };
			}

			tabcontent.$set(tabcontent_changes);
		},
		i(local) {
			if (current) return;
			transition_in(navbar.$$.fragment, local);
			transition_in(alert.$$.fragment, local);
			transition_in(card0.$$.fragment, local);
			transition_in(avatar0.$$.fragment, local);
			transition_in(avatar1.$$.fragment, local);
			transition_in(avatargroup.$$.fragment, local);
			transition_in(badge0.$$.fragment, local);
			transition_in(badge1.$$.fragment, local);
			transition_in(badge2.$$.fragment, local);
			transition_in(breadcrumb.$$.fragment, local);
			transition_in(button0.$$.fragment, local);
			transition_in(button1.$$.fragment, local);
			transition_in(button2.$$.fragment, local);
			transition_in(buttongroup.$$.fragment, local);
			transition_in(carousel.$$.fragment, local);
			transition_in(card1.$$.fragment, local);
			transition_in(divider0.$$.fragment, local);
			transition_in(card2.$$.fragment, local);
			transition_in(divider1.$$.fragment, local);
			transition_in(countdown.$$.fragment, local);
			transition_in(button3.$$.fragment, local);
			transition_in(drawer.$$.fragment, local);
			transition_in(dropdown.$$.fragment, local);
			transition_in(image.$$.fragment, local);
			transition_in(link.$$.fragment, local);
			transition_in(menu.$$.fragment, local);
			transition_in(button4.$$.fragment, local);
			transition_in(modal.$$.fragment, local);
			transition_in(pagination.$$.fragment, local);
			transition_in(button5.$$.fragment, local);
			transition_in(popover.$$.fragment, local);
			transition_in(tabcontent.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(navbar.$$.fragment, local);
			transition_out(alert.$$.fragment, local);
			transition_out(card0.$$.fragment, local);
			transition_out(avatar0.$$.fragment, local);
			transition_out(avatar1.$$.fragment, local);
			transition_out(avatargroup.$$.fragment, local);
			transition_out(badge0.$$.fragment, local);
			transition_out(badge1.$$.fragment, local);
			transition_out(badge2.$$.fragment, local);
			transition_out(breadcrumb.$$.fragment, local);
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			transition_out(button2.$$.fragment, local);
			transition_out(buttongroup.$$.fragment, local);
			transition_out(carousel.$$.fragment, local);
			transition_out(card1.$$.fragment, local);
			transition_out(divider0.$$.fragment, local);
			transition_out(card2.$$.fragment, local);
			transition_out(divider1.$$.fragment, local);
			transition_out(countdown.$$.fragment, local);
			transition_out(button3.$$.fragment, local);
			transition_out(drawer.$$.fragment, local);
			transition_out(dropdown.$$.fragment, local);
			transition_out(image.$$.fragment, local);
			transition_out(link.$$.fragment, local);
			transition_out(menu.$$.fragment, local);
			transition_out(button4.$$.fragment, local);
			transition_out(modal.$$.fragment, local);
			transition_out(pagination.$$.fragment, local);
			transition_out(button5.$$.fragment, local);
			transition_out(popover.$$.fragment, local);
			transition_out(tabcontent.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(navbar, detaching);
			if (detaching) detach(t0);
			destroy_component(alert, detaching);
			if (detaching) detach(t1);
			destroy_component(card0, detaching);
			if (detaching) detach(t2);
			destroy_component(avatar0, detaching);
			if (detaching) detach(t3);
			destroy_component(avatar1, detaching);
			if (detaching) detach(t4);
			destroy_component(avatargroup, detaching);
			if (detaching) detach(t5);
			if (detaching) detach(h10);
			if (detaching) detach(t7);
			destroy_component(badge0, detaching);
			if (detaching) detach(t8);
			destroy_component(badge1, detaching);
			if (detaching) detach(t9);
			destroy_component(badge2, detaching);
			if (detaching) detach(t10);
			if (detaching) detach(h11);
			if (detaching) detach(t12);
			destroy_component(breadcrumb, detaching);
			if (detaching) detach(t13);
			if (detaching) detach(h12);
			if (detaching) detach(t15);
			destroy_component(button0, detaching);
			if (detaching) detach(t16);
			destroy_component(button1, detaching);
			if (detaching) detach(t17);
			destroy_component(button2, detaching);
			if (detaching) detach(t18);
			destroy_component(buttongroup, detaching);
			if (detaching) detach(t19);
			if (detaching) detach(h13);
			if (detaching) detach(t21);
			destroy_component(carousel, detaching);
			if (detaching) detach(t22);
			if (detaching) detach(h14);
			if (detaching) detach(t24);
			if (detaching) detach(div0);
			destroy_component(card1);
			destroy_component(divider0);
			destroy_component(card2);
			if (detaching) detach(t27);
			destroy_component(divider1, detaching);
			if (detaching) detach(t28);
			if (detaching) detach(h15);
			if (detaching) detach(t30);
			destroy_component(countdown, detaching);
			if (detaching) detach(t31);
			destroy_component(button3, detaching);
			if (detaching) detach(t32);
			destroy_component(drawer, detaching);
			if (detaching) detach(t33);
			if (detaching) detach(h16);
			if (detaching) detach(t35);
			destroy_component(dropdown, detaching);
			if (detaching) detach(t36);
			if (detaching) detach(h17);
			if (detaching) detach(t38);
			destroy_component(image, detaching);
			if (detaching) detach(t39);
			if (detaching) detach(h18);
			if (detaching) detach(t41);
			destroy_component(link, detaching);
			if (detaching) detach(t42);
			if (detaching) detach(h19);
			if (detaching) detach(t44);
			destroy_component(menu, detaching);
			if (detaching) detach(t45);
			if (detaching) detach(h110);
			if (detaching) detach(t47);
			destroy_component(button4, detaching);
			if (detaching) detach(t48);
			destroy_component(modal, detaching);
			if (detaching) detach(t49);
			if (detaching) detach(h111);
			if (detaching) detach(t51);
			destroy_component(pagination, detaching);
			if (detaching) detach(t52);
			if (detaching) detach(h112);
			if (detaching) detach(t54);
			destroy_component(button5, detaching);
			if (detaching) detach(t55);
			destroy_component(popover, detaching);
			if (detaching) detach(t56);
			if (detaching) detach(h113);
			if (detaching) detach(t58);
			destroy_component(tabcontent, detaching);
			if (detaching) detach(t59);
			if (detaching) detach(div1);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let drawerOpen = false;
	let modalOpen = false;
	let count = 0;

	setInterval(
		() => {
			$$invalidate(2, count = count + 1);
		},
		1000
	);

	const click_handler = () => $$invalidate(0, drawerOpen = true);

	function drawer_show_binding(value) {
		drawerOpen = value;
		$$invalidate(0, drawerOpen);
	}

	const click_handler_1 = () => $$invalidate(1, modalOpen = true);
	const click_handler_2 = () => $$invalidate(1, modalOpen = false);

	function modal_open_binding(value) {
		modalOpen = value;
		$$invalidate(1, modalOpen);
	}

	return [
		drawerOpen,
		modalOpen,
		count,
		click_handler,
		drawer_show_binding,
		click_handler_1,
		click_handler_2,
		modal_open_binding
	];
}

class App extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

const app = new App({
    target: document.body
});

export { app as default };
