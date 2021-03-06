'use strict';

var React = require('react-native');
var NavigationBar = require('react-native-navbar');
var Listings = require('./Listings');
var AddListing = require('./AddListing');
var utils = require('./utils');
var _ = require('lodash');
var {
  AsyncStorage,
  NavigatorIOS,
  AppRegistry,
  AlertIOS
} = React;

var styles = React.StyleSheet.create({
  container: {
    flex: 1
  }
});

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

OpenHouseApp = _.extend(OpenHouseApp, {
  title :'Listings',
  rightButtonTitle: '+',
  leftButtonTitle: '='
});

class OpenHouseApp extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      title: OpenHouseApp.title,
      component: Listings,
      passProps: {listings: [], onDeleteListing: this.onDeleteListing.bind(this)},
      rightButtonTitle: OpenHouseApp.rightButtonTitle,
      onRightButtonPress: this.addListingView.bind(this)
    };
  }

  componentDidMount(){
    AsyncStorage.getItem('listings')
      .then((value) => {
        this.state.listings = value?JSON.parse(value):[];
        this.state.passProps.listings = this.state.listings;
        this.redrawListings();
      })
      .done();
  }

  componentWillUnmount(){
    navigator.geolocation.clearWatch(this.watchID);
  }

  _updateDistances(){
    _.map(this.state.listings, cur => {
      cur.distance = utils.calcCrow(cur.lat, cur.lng, this.curLat, this.curLon);
      return cur;
    });
    this.state.watchID = this.watchID;
    this.state.passProps.listings = this.state.listings;
    this.state.passProps.watchID = this.state.watchID;
    this.state.passProps.lat = this.curLat;
    this.state.passProps.lng = this.curLon;
    // AlertIOS.alert('Distance is ');
    this.redrawListings();
  }

  onDeleteListing(id){
    this.state.listings = this.state.listings
      .filter(prop => prop.id !== id);
    this.state.passProps.listings = this.state.listings;

    AsyncStorage.setItem('listings', JSON.stringify(this.state.listings))
      .done();
    this.redrawListings();
  }

  onAddListing(listing){
    listing.id = guid();
    console.log(listing.id);
    listing.distance = utils.calcCrow(listing.lat, 
        listing.lng, this.curLat, this.curLon);
    
    this.state.listings.push(listing);
    this.state.passProps.listings = this.state.listings;
    AsyncStorage.setItem('listings', JSON.stringify(this.state.listings))
      .done();
    this.refs.nav.pop();
    this.redrawListings();
  }

  addListingView(){
    navigator.geolocation.clearWatch(this.watchID);
    this.refs.nav.push({
      title: 'Add Listing',
      component: AddListing,
      passProps: {onAddListing: this.onAddListing.bind(this)}
    });
  }

  startWatch(){
    this.watchID = navigator.geolocation.watchPosition((lastPosition) => {
      this.curLat = lastPosition.coords.latitude;
      this.curLon = lastPosition.coords.longitude;
      this._updateDistances();
    },
    (error) => console.error(error));
  }

  redrawListings(){
    this.refs.nav.replace(this.state);
    this.startWatch();
  }

  render() {
    return (
      <NavigatorIOS
        style={styles.container}
        ref="nav"
        initialRoute={this.state}/>
    );
  }
}

AppRegistry.registerComponent('openHouse', () => OpenHouseApp);
