import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

    app = initializeApp(environment.firebase);
    auth = getAuth(this.app);
    db = getDatabase(this.app);

  constructor() {
    console.log('🔥 Firebase initialized');
  }
}
