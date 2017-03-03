/**
 * Copyright (c) 2016-2017 Dmitry Panyushkin
 * Available under MIT license
 */
jest.unmock("knockout");
jest.unmock("../knockout-decorators");
jest.unmock("../observable-array");
jest.unmock("../observable-array-proxy");
jest.unmock("../observable-property");
jest.unmock("../property-extenders");

import * as ko from "knockout";
import { autobind, Disposable, event, observable } from "../knockout-decorators";

describe("Disposable mixin", () => {
    it("should apply mixin without base class", () => {
        class ViewModel extends Disposable() { }

        expect(ViewModel.prototype.dispose).toBeInstanceOf(Function);
        expect(ViewModel.prototype.subscribe).toBeInstanceOf(Function);
    });

    it("should apply mixin with base class", () => {
        class Base {
            baseField = 100;

            constructor(multiplier: number) {
                this.baseField *= multiplier;
            }
            baseMethod() {
                return "test";
            }
        }

        class ViewModel extends Disposable(Base) { }

        expect(ViewModel.prototype.baseMethod).toBeInstanceOf(Function);
        expect(ViewModel.prototype.dispose).toBeInstanceOf(Function);
        expect(ViewModel.prototype.subscribe).toBeInstanceOf(Function);

        let vm = new ViewModel(5);

        expect(vm.baseField).toBe(500);
        expect(vm.baseMethod()).toBe("test");
    });

    it("should subscribe given callback to @observable changes", () => {
        class ViewModel extends Disposable() {
            plainField: number;

            @observable observableField: number = 0;

            constructor() {
                super();
                this.subscribe(() => this.observableField, (value) => {
                    this.plainField = value;
                });
            }
        }

        let vm = new ViewModel();
        vm.observableField = 123;

        expect(vm.plainField).toBe(123);
    });

    it("should subscribe given callback to @event", () => {
        class Publisher {
            @event event: (sender: Publisher, argument: string) => void;
        }

        class Subscriber extends Disposable() {
            eventHandled: boolean = false;

            constructor(event: (sender: Publisher, argument: string) => void) {
                super();
                this.subscribe(event, (sender: Publisher, argument: string) => {
                    this.eventHandled = true;
                    expect(sender).toBe(publisher);
                    expect(argument).toBe("event argument");
                });
            }
        }

        let publisher = new Publisher();
        let subscriber = new Subscriber(publisher.event);

        publisher.event(publisher, "event argument");

        expect(subscriber.eventHandled).toBe(true);
    });

    it("should return created KnockoutSubscription", () => {
        class ViewModel extends Disposable() {
            @observable observable: number = 0;

            constructor() {
                super();
            }
        }

        let vm = new ViewModel();
        let koObservable = ko.observable();

        // tslint:disable-next-line:no-empty
        let givenSubscription = vm.subscribe(() => vm.observable, () => { });
        // tslint:disable-next-line:no-empty
        let koSubscription = koObservable.subscribe(() => { });

        expect(Object.hasOwnProperty.call(givenSubscription, "dispose")).toBeTruthy();
        expect(Object.getPrototypeOf(givenSubscription)).toBe(Object.getPrototypeOf(koSubscription));
    });

    it("should dispose all subscriptions", () => {
        let observableSideEffect: number = 0;
        let eventSideEffect: number = 0;

        class ViewModel extends Disposable() {
            @observable observable: number = 0;
            @event event: (agrument: number) => void;

            constructor() {
                super();
                this.subscribe(() => this.observable, (value) => {
                    observableSideEffect = value;
                });
                this.subscribe(this.event, (agrument) => {
                    eventSideEffect = agrument;
                });
            }
        }

        let vm = new ViewModel();
        vm.observable = 123;
        vm.event(123);

        vm.dispose();

        vm.observable = 456;
        vm.event(789);

        expect(observableSideEffect).toBe(123);
        expect(eventSideEffect).toBe(123);
    });
});