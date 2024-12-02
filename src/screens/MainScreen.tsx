import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { COLORS } from '../theme/theme'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import PushNotification from 'react-native-push-notification';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'react-native';

interface Notification {
    id: number;
    date: string;
    title: string;
    message: string;
}

const MainScreen = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    useEffect(() => {
        PushNotification.createChannel(
            {
                channelId: "default-channel",
                channelName: "Default Channel",
                channelDescription: "A default channel for general notifications",
                soundName: "default",
                importance: 4,
                vibrate: true,
            },
            (created) => console.log(`Channel creation status: '${created}'`)
        );

        PushNotification.configure({
            onNotification: function (notification) {
                console.log('LOCAL NOTIFICATION ==>', notification);
            },
            popInitialNotification: true,
            requestPermissions: Platform.OS === 'ios',
        });
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        const storedNotifications = await AsyncStorage.getItem('NOTI');
        if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
        console.log(notifications)
    };

    const saveNotifications = async (notifications: Notification[]) => {
        await AsyncStorage.setItem('NOTI', JSON.stringify(notifications));
    };

    const [isModalVisible, setModalVisible] = useState(false);
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [value, setValue] = useState('');
    const [title, setTitle] = useState('');
    const [msg, setMsg] = useState('');
    const [myid, setId] = useState<any | null>(null);

    const toggleModalVisibility = (isNew: boolean) => {
        if (isNew) {
            setDate(new Date());
            setTime(new Date());
            setTitle('');
            setMsg('');
            setId(null);
        }
        setModalVisible(!isModalVisible);
    };
    const editNotification = (notification: Notification) => {
        setDate(new Date(notification.date));
        setTime(new Date(notification.date));
        setId(notification.id);
        setMsg(notification.message);
        setTitle(notification.title);
        toggleModalVisibility(false);
    };

    const deleteNotification = (id: number) => {
        const stringid = id.toString();
        PushNotification.cancelLocalNotifications({ id: stringid });
        const updatedNotifications = notifications.filter(n => n.id !== id);
        setNotifications(updatedNotifications);
        saveNotifications(updatedNotifications);
    };

    const data = [{ label: 'day' }, { label: 'week' }, { label: 'month' }];

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (event.type === 'set') {
            const currentDate = selectedDate || date;
            setDate(currentDate);
        }
        setShowDatePicker(false);
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        if (event.type === 'set') {
            const currentTime = selectedTime || time;
            setTime(currentTime);
        }
        setShowTimePicker(false);
    };


    const sheduleNotification = (noti: Notification) => {
        const id = noti.id;
        const noteDate = noti.date;

        console.log(`Scheduling notification for: ${noteDate.toLocaleString()}`);

        PushNotification.localNotificationSchedule({
            id: id,
            channelId: 'default-channel',
            title: noti.title,
            message: noti.message,
            date: new Date(noteDate),
            allowWhileIdle: true,
        });

        // PushNotification.localNotification({
        //     channelId: 'default-channel-id',
        //     title: 'Test Notification',
        //     message: 'This is a test notification!',
        // });

        const newNotification: Notification = { id: noti.id, date: noti.date, title: noti.title, message: noti.message };
        const updatedNotifications = notifications.length > 0 && notifications.some(n => n.id === noti.id)
            ? notifications.map(n => n.id === noti.id ? newNotification : n)
            : [...notifications, newNotification];

        setNotifications(updatedNotifications);
        saveNotifications(updatedNotifications);

        Alert.alert('Notification scheduled', `Your notification will be sent at ${new Date(noteDate).toLocaleString()}`);
        toggleModalVisibility(false);
    }
    const renderNotificationItem = ({ item }: { item: Notification }) => (

        <View style={styles.notificationItem}>
           
            <Text style={{ color: COLORS.Black }}>Date & Time: {new Date(item.date).toLocaleString()}</Text>
            <Text style={{ color: COLORS.Black }}>Title: {item.title}</Text>
            <Text style={{ color: COLORS.Black }}>Message: {item.message}</Text>
            <View style={{ flex: 1, flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' }}>
                <View style={{ width: '45%' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', backgroundColor: COLORS.Orange, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }} onPress={() => {

                        editNotification(item)
                    }}>
                        <MaterialIcons name='mode-edit' size={20} color={COLORS.Black} />
                        <Text style={{ marginLeft: 10, color: COLORS.Black }}>Edit</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ width: '45%' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', backgroundColor: COLORS.Grey, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }} onPress={() => {

                        deleteNotification(item.id);
                    }}>
                        <MaterialIcons name='delete' size={20} color={COLORS.White} />
                        <Text style={{ marginLeft: 10, color: COLORS.White }}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>


        </View>
    );

    return (
        <View style={styles.conatiner}>
             <StatusBar
                animated={true}
                backgroundColor={COLORS.Grey}
  
            />
            <View style={styles.toolbar}/>
            <FlatList data={notifications} renderItem={renderNotificationItem} keyExtractor={(item, index) => String(index)}
                ListEmptyComponent={<Text style={{ color: COLORS.White, textAlign: 'center', marginTop: 20 }}>No Notifications Scheduled</Text>} />
            <TouchableOpacity style={styles.btnShedule} onPress={() => { toggleModalVisibility(true) }}>
                <MaterialIcons style={styles.addIcon} name='add' size={30} color={COLORS.Black} />
            </TouchableOpacity>
            <Modal animationType="slide"
                transparent visible={isModalVisible}
                presentationStyle="overFullScreen"
                onDismiss={() => { toggleModalVisibility(false) }}>
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <Text style={{fontSize:20,color:COLORS.Orange,fontWeight:700}}>Custom Notifications</Text>
                        <Text style={styles.selectDate}>Enter title</Text>
                        <View style={styles.dropContainer}>
                            <TextInput value={title} onChangeText={setTitle} />
                        </View>
                        <Text style={styles.selectDate}>Enter message</Text>
                        <View style={styles.dropContainer}>
                            <TextInput value={msg} onChangeText={setMsg} />
                        </View>

                        <Text style={styles.selectDate}>Select Date</Text>
                        <TouchableOpacity style={styles.dateContainer} onPress={() => setShowDatePicker(true)}>
                            <Text>{date.toLocaleString()}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode='date'
                                onChange={handleDateChange}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            />
                        )}
                        <Text style={styles.selectDate}>Select Time</Text>
                        <TouchableOpacity style={styles.dateContainer} onPress={() => setShowTimePicker(true)}>
                            <Text>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </TouchableOpacity>
                        {showTimePicker && (
                            <DateTimePicker
                                value={time}
                                mode='time'
                                onChange={handleTimeChange}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            />
                        )}
                        {/* <Text style={styles.selectDate}>Select Interval</Text>
                        <View style={styles.dropContainer}>
                            <Dropdown
                                labelField="label"
                                valueField="label"
                                placeholder='Select Interval'
                                data={data}
                                value={value}
                                search
                                onChange={item => setValue(item.label)}
                            />
                        </View> */}
                        <TouchableOpacity style={styles.buttonBackground} onPress={() => {

                            const id = (myid == null) ? Math.floor(Math.random() * 1000) : myid;


                            const noteDate = new Date(date);
                            noteDate.setHours(time.getHours());
                            noteDate.setMinutes(time.getMinutes());
                            const noti: Notification = {
                                id: id,
                                date: noteDate.toISOString(),
                                title: title,
                                message: msg
                            }
                            sheduleNotification(noti)
                        }}>
                            <Text style={styles.textColor}>Schedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnClose} onPress={() => { toggleModalVisibility(false) }}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default MainScreen;

const styles = StyleSheet.create({
    conatiner: {
        flex: 1,
        backgroundColor: COLORS.Black,
    },
    btnShedule: {
        position: 'absolute',
        backgroundColor: COLORS.Orange,
        height: 50,
        width: 50,
        bottom: 0,
        right: 0,
        margin: 20,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnClose: {
        marginTop: 15,
        backgroundColor: COLORS.Grey,
        borderRadius: 5,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addIcon: {
        alignSelf: 'center',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
    },
    closeText: {
        color: COLORS.White,
    },
    dateContainer: {
        borderRadius: 5,
        borderWidth: 1,
        borderColor: COLORS.Orange,
        height: 50,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },
    dropContainer: {
        borderRadius: 5,
        borderWidth: 1,
        borderColor: COLORS.Orange,
        height: 50,
        width: '100%',
        marginTop: 5,
        justifyContent: 'center',
    },
    selectDate: {
        marginTop: 10,
        color: COLORS.Black,
    },
    buttonBackground: {
        marginTop: 15,
        backgroundColor: COLORS.Orange,
        borderRadius: 5,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textColor: {
        color: COLORS.Black,
    },
    toolbar: {
        height: 56,
        backgroundColor: COLORS.Orange,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    notificationItem: { padding: 10, margin: 10, backgroundColor: '#fff', borderRadius: 8, flexDirection: 'column' },
});
