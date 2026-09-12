export function isVisible(element) {
  if (!element || !element.isConnected || element.closest('[hidden]')) return false;
  const style = element.ownerDocument.defaultView.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
}

// Pure geometry, shared by the runtime and regression tests.
export function tourPlacement(target, panel, viewport) {
  const gap = 16, margin = 12;
  const width = Math.min(panel.width, viewport.width - margin * 2);
  const height = Math.min(panel.height, viewport.height - margin * 2);
  const clamp = (value, min, max) => Math.max(min, Math.min(value, Math.max(min, max)));
  if (!target) return { left: (viewport.width - width) / 2, top: (viewport.height - height) / 2, width, height };
  let left, top;
  if (target.right + gap + width <= viewport.width - margin) {
    left = target.right + gap; top = target.top;
  } else if (target.left - gap - width >= margin) {
    left = target.left - gap - width; top = target.top;
  } else if (target.bottom + gap + height <= viewport.height - margin) {
    left = target.left; top = target.bottom + gap;
  } else if (target.top - gap - height >= margin) {
    left = target.left; top = target.top - gap - height;
  } else {
    left = viewport.width - width - margin;
    // Prefer the side of the screen furthest from the highlighted element.
    top = target.top + target.height / 2 < viewport.height / 2 ? viewport.height - height - margin : margin;
  }
  return { left: clamp(left, margin, viewport.width - width - margin), top: clamp(top, margin, viewport.height - height - margin), width, height };
}

export function createPageTour({ document: doc = document, window: win = window, onStop = () => {}, onAction = () => {} } = {}) {
  let root = null, guide = null, index = 0, anchor = null, opener = null, events = null, frame = 0;
  const node = (tag, className, text) => {
    const element = doc.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const button = (text, className, handler) => {
    const element = node('button', className, text);
    element.type = 'button';
    element.addEventListener('click', handler);
    return element;
  };
  function targetFor(item) {
    if (item.element) return isVisible(item.element) ? item.element : null;
    const scope = guide.scope || doc.querySelector('#main-content');
    if (!scope || !item.target) return null;
    return [...scope.querySelectorAll(item.target)].find(isVisible) || null;
  }
  function stop(reason = 'closed', restore = true) {
    if (!root) return;
    const previous = opener;
    events?.abort(); events = null;
    win.cancelAnimationFrame(frame);
    if (root.open) root.close();
    root.remove(); root = null; anchor = null;
    onStop(reason);
    if (restore && isVisible(previous)) previous.focus({ preventScroll: true });
  }
  function position() {
    if (!root) return;
    const panel = root.querySelector('.page-tour-panel');
    const spotlight = root.querySelector('.page-tour-spotlight');
    const bounds = { width: win.innerWidth, height: win.innerHeight };
    const rect = isVisible(anchor) ? anchor.getBoundingClientRect() : null;
    const visible = rect && rect.bottom > 0 && rect.right > 0 && rect.top < bounds.height && rect.left < bounds.width;
    spotlight.hidden = !visible;
    root.classList.toggle('page-tour-unanchored', !visible);
    if (visible) {
      const left = Math.max(4, rect.left - 5), top = Math.max(4, rect.top - 5);
      Object.assign(spotlight.style, { left: `${left}px`, top: `${top}px`, width: `${Math.max(0, Math.min(bounds.width - 4, rect.right + 5) - left)}px`, height: `${Math.max(0, Math.min(bounds.height - 4, rect.bottom + 5) - top)}px` });
    }
    panel.style.maxHeight = `${Math.max(80, bounds.height - 24)}px`;
    const layout = tourPlacement(visible ? rect : null, panel.getBoundingClientRect(), bounds);
    panel.style.left = `${layout.left}px`; panel.style.top = `${layout.top}px`;
  }
  function schedulePosition() {
    win.cancelAnimationFrame(frame);
    frame = win.requestAnimationFrame(position);
  }
  function render() {
    if (!root) return;
    const item = guide.steps[index];
    anchor = targetFor(item);
    root.replaceChildren(node('div', 'page-tour-spotlight'));
    const panel = node('section', 'page-tour-panel');
    const heading = node('header', 'page-tour-header');
    const context = node('div');
    context.append(node('small', '', 'COMO USAR ESTA ABA'), node('strong', '', guide.title));
    const close = button('×', 'page-tour-close', () => stop());
    close.setAttribute('aria-label', 'Fechar guia');
    heading.append(context, close);
    const label = node('label', 'page-tour-index-label', 'Ir direto ao assunto');
    const select = node('select', 'page-tour-index');
    guide.steps.forEach((value, i) => {
      const option = node('option', '', `${i + 1}. ${value.title}`);
      option.value = String(i); option.selected = i === index; select.append(option);
    });
    select.addEventListener('change', () => go(Number(select.value)));
    label.append(select);
    const body = node('div', 'page-tour-body');
    const progress = node('p', 'page-tour-progress', `Passo ${index + 1} de ${guide.steps.length}`);
    progress.setAttribute('aria-live', 'polite');
    const title = node('h2', '', item.title);
    title.id = 'page-tour-title'; title.tabIndex = -1;
    const text = node('p', '', item.text); text.id = 'page-tour-description';
    body.append(progress, title, text);
    if (!anchor) body.append(node('p', 'page-tour-note', 'Este controle não aparece neste recorte. Ele pode depender de registros, da situação do item ou de uma permissão. Você pode continuar o guia normalmente.'));
    else if (anchor.matches(':disabled')) body.append(node('p', 'page-tour-note', 'Este controle está desabilitado. Confira os requisitos descritos antes de utilizá-lo.'));
    if (item.action && anchor && !anchor.matches(':disabled')) {
      body.append(button(item.action.label, 'btn btn-secondary page-tour-action', () => {
        const action = item.action;
        stop('action', false);
        onAction(action);
      }));
    }
    body.append(node('p', 'page-tour-safety', 'O guia não preenche, salva ou envia dados.'));
    const footer = node('footer', 'page-tour-footer');
    const back = button('Voltar', 'btn btn-quiet', () => go(index - 1)); back.disabled = index === 0;
    const next = button(index === guide.steps.length - 1 ? 'Concluir guia' : 'Próximo', 'btn btn-primary', () => index === guide.steps.length - 1 ? stop('completed') : go(index + 1));
    footer.append(back, next);
    panel.append(heading, label, body, footer);
    root.append(panel);
    anchor?.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
    title.focus({ preventScroll: true });
    position(); schedulePosition();
  }
  function go(value) {
    if (!root) return;
    index = Math.max(0, Math.min(value, guide.steps.length - 1));
    render();
  }
  function start(value) {
    if (!value?.steps?.length) return false;
    stop('restarted', false);
    guide = value; index = 0; opener = doc.activeElement;
    events = new win.AbortController();
    root = node('dialog', 'page-tour-root');
    root.setAttribute('aria-labelledby', 'page-tour-title');
    root.setAttribute('aria-describedby', 'page-tour-description');
    root.addEventListener('cancel', event => { event.preventDefault(); stop(); });
    root.addEventListener('close', () => { if (root && !root.open) stop(); });
    root.addEventListener('keydown', event => {
      if (event.target.matches('select, input, textarea')) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); go(index + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    doc.body.append(root);
    root.showModal();
    doc.addEventListener('scroll', schedulePosition, { capture: true, passive: true, signal: events.signal });
    win.addEventListener('resize', schedulePosition, { signal: events.signal });
    win.visualViewport?.addEventListener('resize', schedulePosition, { signal: events.signal });
    render();
    return true;
  }
  return { start, stop, go, isOpen: () => Boolean(root) };
}
