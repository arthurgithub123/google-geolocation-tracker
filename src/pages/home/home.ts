import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';

import { filter } from 'rxjs/operators';
import { Subscription } from '../../../node_modules/rxjs/Subscription';
import { Geolocation } from '@ionic-native/geolocation';
import { Storage } from '@ionic/storage';

declare var google;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController,
              private platform: Platform,
              private geolocation: Geolocation,
              private storage: Storage) {

  }

  @ViewChild('map') mapElement: ElementRef;
  map: any;
  currentMapTrack = null;

  isTracking = false;
  trackedRoute = [];
  previousTracks = [];

  positionSubscription: Subscription;

  ionViewDidLoad() {

    this.platform.ready().then(() => {

      this.loadHistoricRoutes();

      let mapOptions = {
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      }

      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      this.geolocation.getCurrentPosition().then(pos => {

        let latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        this.map.setCenter(latLng);
        this.map.setZoom(16);

        new google.maps.Marker({
          map: this.map,
          position: latLng,
          title: 'Hello World!'
        });

      })
        .catch((error) => {
          alert('Error getting location' + error);
        });
    });
  }

  loadHistoricRoutes() {
    this.storage.get('routes').then(data => {
      if (data) {
        this.previousTracks = data;
      }
    });
  }


  startTracking() {

    this.isTracking = true;
    this.trackedRoute = [];

    this.positionSubscription = this.geolocation.watchPosition()
      .pipe(
        filter((p) => p.coords !== undefined)
      )
      .subscribe(data => {

        setTimeout(() => {
          this.trackedRoute.push({ lat: data.coords.latitude, lng: data.coords.longitude });
          this.redrawPath(this.trackedRoute);
        }, 0);
      });

  }

  redrawPath(path) {

    if (this.currentMapTrack) {
      this.currentMapTrack.setMap(null);
    }

    if (path.length > 1) {

      this.currentMapTrack = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#ff00ff',
        strokeOpacity: 1.0,
        strokeWeight: 3
      });
      this.currentMapTrack.setMap(this.map);
    }
  }

  stopTracking() {

    let newRoute = { finished: new Date().getTime(), path: this.trackedRoute };
    this.previousTracks.push(newRoute);
    this.storage.set('routes', this.previousTracks);

    this.isTracking = false;
    this.positionSubscription.unsubscribe();
    this.currentMapTrack.setMap(null);
  }

  showHistoryRoute(route) {
    this.redrawPath(route);
  }

}
