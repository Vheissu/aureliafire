import { DI } from '@aurelia/kernel';
import { BehaviorSubject } from 'rxjs';
import {
  CollectionReference,
  doc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import type {
  Firestore,
  Query,
  DocumentReference,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

export class DocStore<T> extends BehaviorSubject<T | null> {
  static inject = [DI.createInterface<Firestore>(), 'ref', 'startWith'];

  constructor(
    private firestore: Firestore,
    ref: string | DocumentReference,
    startWith?: T
  ) {
    super(startWith ?? null);

    if (!this.firestore || !globalThis.window) {
      console.warn('Firestore is not initialized or not in browser');
    } else {
      const docRef =
        typeof ref === 'string' ? doc(firestore, ref) : ref;
      onSnapshot(docRef, (snapshot) => {
        this.next((snapshot.data() as T) ?? null);
      });
    }
  }
}

export class CollectionStore<T> extends BehaviorSubject<T[] | null> {
  static inject = [DI.createInterface<Firestore>(), 'ref', 'startWith'];

  constructor(
    private firestore: Firestore,
    ref: string | Query | CollectionReference,
    startWith?: T[]
  ) {
    super(startWith ?? []);

    if (!firestore || !globalThis.window) {
      console.warn('Firestore is not initialized or not in browser');
    } else {
      const colRef =
        typeof ref === 'string' ? collection(firestore, ref) : ref;
      onSnapshot(colRef, (snapshot) => {
        const data = snapshot.docs.map((s) => {
          return { id: s.id, ref: s.ref, ...s.data() } as T;
        });
        this.next(data);
      });
    }
  }
}

export class UserStore extends BehaviorSubject<unknown | null> {
  static inject = [DI.createInterface<Auth>()];

  constructor(private auth: Auth) {
    super(auth?.currentUser ?? null);

    if (!auth || !globalThis.window) {
      console.warn('Auth is not initialized or not in browser');
    } else {
      onAuthStateChanged(auth, (user) => {
        this.next(user);
      });
    }
  }
}

// SDK store for FirebaseApp comopnent
export const sdk = new BehaviorSubject<{
  auth: Auth;
  firestore: Firestore;
} | null>(null);
