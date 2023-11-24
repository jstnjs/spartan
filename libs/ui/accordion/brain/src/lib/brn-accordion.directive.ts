import { FocusKeyManager } from '@angular/cdk/a11y';
import {
	AfterContentInit,
	computed,
	ContentChildren,
	Directive,
	ElementRef,
	inject,
	Input,
	QueryList,
	signal,
} from '@angular/core';
import { rxHostListener } from '@spartan-ng/ui-core';
import { BrnAccordionTriggerDirective } from './brn-accordion-trigger.directive';

@Directive({
	selector: '[brnAccordion]',
	standalone: true,
	host: {
		'[attr.data-state]': 'state()',
		'[attr.data-orientation]': 'orientation',
	},
})
export class BrnAccordionDirective implements AfterContentInit {
	@Input()
	public type: 'single' | 'multiple' = 'single';
	@Input()
	public dir: 'ltr' | 'rtl' | null = null;
	@Input()
	public orientation: 'horizontal' | 'vertical' = 'vertical';

	private _el = inject(ElementRef);

	private readonly _openItemIds = signal<number[]>([]);
	public openItemIds = this._openItemIds.asReadonly();
	public state = computed(() => (this._openItemIds().length > 0 ? 'open' : 'closed'));
	private _keyManager?: FocusKeyManager<BrnAccordionTriggerDirective>;
	private _keyDownListener = rxHostListener('keydown');

	constructor() {
		this._el.nativeElement.addEventListener('keydown', (event: KeyboardEvent) => {
			// if one of the triggers is focused, prevent default on certain keys
			for (const trigger of this.triggers?.toArray() ?? []) {
				if (trigger.id === document.activeElement?.id) {
					if ('key' in event) {
						let keys = ['ArrowUp', 'ArrowDown', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Enter'];
						if (this.orientation === 'horizontal') {
							keys = ['ArrowLeft', 'ArrowRight', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Enter'];
						}
						if (keys.includes(event.key as string)) {
							event.preventDefault();
						}
					}
					return;
				}
			}
		});
	}

	@ContentChildren(BrnAccordionTriggerDirective, { descendants: true })
	public triggers?: QueryList<BrnAccordionTriggerDirective>;

	public ngAfterContentInit() {
		if (!this.triggers) {
			return;
		}
		this._keyManager = new FocusKeyManager<BrnAccordionTriggerDirective>(this.triggers)
			.withHomeAndEnd()
			.withPageUpDown()
			.withWrap();

		if (this.orientation === 'horizontal') {
			this._keyManager.withHorizontalOrientation(this.dir ?? 'ltr').withVerticalOrientation(false);
		}
		this._keyDownListener.subscribe((event) => {
			this._keyManager?.onKeydown(event as KeyboardEvent);
		});
	}
	public setActiveItem(id: number) {
		this._keyManager?.setActiveItem(id);
	}

	public toggleItem(id: number) {
		console.log(this.type);
		if (this._openItemIds().includes(id)) {
			this._openItemIds.update((ids) => ids.filter((openId) => id !== openId));
			return;
		} else if (this.type === 'single') {
			this._openItemIds.set([]);
		}
		this._openItemIds.update((ids) => [...ids, id]);
	}
}