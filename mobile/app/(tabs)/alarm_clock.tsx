import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Platform, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from "expo-notifications";

//CURRENTLY NOT WORKING, expo-notifications does not support Android anymore
//Will fix in future

export default function AlarmClock() {
	type Alarm = {
	id: number;
	time: Date;
	active: boolean;
	};

	const [alarmsCreated, setAlarmsCreated] = useState<Alarm[]>([]);
	const [showTimePicker, setShowTimePicker] = useState(false);

	const showTimePickerModal = () => {
		setShowTimePicker(true);
	};

	const hideTimePickerModal = () => {
		setShowTimePicker(false);
	};

	const deleteAlarm = (id:number) => {
		if(id!==undefined){
			setAlarmsCreated(prevAlarms => prevAlarms.filter(alarm => alarm.id !== id));
		}
	};

	const handleTimeChange = (event:any, selectedTime:Date | undefined) => {
		hideTimePickerModal();
		if (selectedTime) {
			const newAlarm = {
		id: Date.now(), 
		time: selectedTime,
		active: true,
		};

		// Add it to the alarms array
		setAlarmsCreated(prevAlarms => [...prevAlarms, newAlarm]);
		}
	};


	const scheduleAlarmNotification = async (alarm: Alarm) => {
		
  		await Notifications.scheduleNotificationAsync({
			content: {
			title: 'Alarm',
			body: 'It is time!',
			data: { alarmId: alarm.id }, 
			categoryIdentifier: 'ALARM_ACTION',
			},
			trigger: {
			type: SchedulableTriggerInputTypes.CALENDAR,
  			hour: alarm.time.getHours(),
  			minute: alarm.time.getMinutes(),
  			repeats: false, 
			}, 
	});
	};

	useEffect(() => { // Request permissions for notifications on iOS
		(async () => {
			if (Platform.OS === 'ios') {
			const { status } = await Notifications.requestPermissionsAsync();
			if (status !== 'granted') {
				alert('Permission for notifications not granted!');
			}
			}
		})();
	}, []);

	useEffect(() => { // Schedule notifications for active alarms
		const checkAlarms = setInterval(() => {
			const currentTime = new Date();
			
			alarmsCreated.forEach(alarm => {
				if(alarm.active && alarm.time.getHours() === currentTime.getHours() 
				&& alarm.time.getMinutes() === currentTime.getMinutes()){
					Alert.alert("Alarm", "Wake up! It's time!");
				}
			});
		}, 1000); // Check every second
		
		return () => clearInterval(checkAlarms); 
	}, [alarmsCreated]);

	useEffect(() => { // Set up notification category for alarm actions
		Notifications.setNotificationCategoryAsync('ALARM_ACTION', [
			{ identifier: 'ok', buttonTitle: 'OK', options: { opensAppToForeground: true } },
		]);
		}, []);

	useEffect(() => {
		const subscription = Notifications.addNotificationResponseReceivedListener(response => {
			const alarmId = response.notification.request.content.data?.alarmId;
			console.log("Received notification response for alarmId:", alarmId);
			if (typeof alarmId === 'number'/* && response.actionIdentifier === 'ok'*/) {
				
				deleteAlarm(alarmId); // remove alarm from state
				
			}
		});

  	return () => subscription.remove();
}, []);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.appName}>AlarmClock</Text>
			</View>

			<View style={styles.clockContainer}>
				<Text style={styles.clockText}>
  					{alarmsCreated.map(alarm => alarm.time.toLocaleTimeString()).join(", ")}
				</Text>
			</View>

			{showTimePicker && (
				<DateTimePicker
					value={new Date()}
					mode="time"
					is24Hour={false}
					display="spinner"
					onChange={handleTimeChange}
				/>
			)}

			<Button
				title="Set Alarm"
				onPress={showTimePickerModal}
				color="#3498db"
			/>
		</View>
	);

}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#ecf0f1", // Set your desired background color
	},
	header: {
		marginBottom: 20,
	},
	appName: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#2c3e50", // Set your desired text color
	},
	clockContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
	},
	clockText: {
		fontSize: 50,
		marginRight: 10,
		color: "#2c3e50", // Set your desired text color
	},
	footerText: {
		marginTop: 20,
		fontSize: 16,
		color: "#7f8c8d", // Set your desired text color
	},
});

