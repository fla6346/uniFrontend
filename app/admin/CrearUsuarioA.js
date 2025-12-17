import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Switch,
  Dimensions
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../../src/api/axiosConfig'; 
import DropDownPicker from 'react-native-dropdown-picker';

const { width } = Dimensions.get('window');

const CrearUsuarioA = () => {
  const router = useRouter();

  const [open, setOpen] = useState(false); 
  const [role, setRole] = useState(null); 
  const [items, setItems] = useState([ 
    { label: 'Administrador', value: 'admin', icon: () => <Ionicons name="shield-checkmark" size={20} color="#e74c3c" /> },
    { label: 'Admisiones', value: 'admisiones', icon: () => <Ionicons name="school" size={20} color="#3498db" /> },
    { label: 'Estudiante', value: 'student', icon: () => <Ionicons name="person" size={20} color="#2ecc71" /> },
    { label: 'Docente', value: 'docente', icon: () => <Ionicons name="library" size={20} color="#1abc9c" /> },        
    { label: 'Director de Carrera', value: 'academico', icon: () => <Ionicons name="person-circle" size={20} color="#8e44ad" /> },
    { label: 'DAF', value: 'daf', icon: () => <Ionicons name="calculator" size={20} color="#9b59b6" /> },
    { label: 'Comunicación', value: 'comunicacion', icon: () => <Ionicons name="megaphone" size={20} color="#e67e22" /> },
    { label: 'TI', value: 'ti', icon: () => <Ionicons name="laptop" size={20} color="#34495e" /> },
    { label: 'Recursos Humanos', value: 'recursos', icon: () => <Ionicons name="people" size={20} color="#f39c12" /> },    
    { label: 'Servicios Estudiantiles', value: 'servicios', icon: () => <Ionicons name="help-circle" size={20} color="#16a085" /> },    
  ]);

  const [facultadSeleccionada, setFacultadSeleccionada] = useState(null); 
  const [openFacultad, setOpenFacultad] = useState(false);
  const [opcionesFacultad, setOpcionesFacultad] = useState([]);

  const [openCarrera, setOpenCarrera] = useState(false);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState(null); // ✅ Corregido a singular
  const [carrerasDocente, setCarrerasDocente] = useState([]);
  const [opcionesCarrera, setOpcionesCarrera] = useState([
      { label: 'Derecho', value: '1' },
      { label: 'Psicología', value: '2' },
      { label: 'Periodismo', value: '3' },
      { label: 'Administración de Empresas', value: '4' },
      { label: 'Administración de Hotelería y Turismo', value: '5' },
      { label: 'Contaduría Pública', value: '6' }, // ✅ ID 6 existe
      { label: 'Ingeniería Comercial', value: '7' },
      { label: 'Ingeniería Económica', value: '8' },
      { label: 'Ingeniería Económica y Financiera', value: '9' },
      { label: 'Arquitectura', value: '10' },
      { label: 'Diseño Gráfico y Producción Cross Media', value: '11' },
      { label: 'Publicidad y Marketing', value: '12' },
      { label: 'Bioquímica y Farmacia', value: '13' },
      { label: 'Enfermería', value: '14' },
      { label: 'Medicina', value: '15' },
      { label: 'Odontología', value: '16' },
      { label: 'Ingeniería de Sistemas', value: '17' },
  ]);

  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    apellidopat: '',
    apellidomat: '',
    email: '',
    contrasenia: '',
    habilitado: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const roleNeedsCarreras = (selectedRole) => {
    return ['student', 'docente', 'academico'].includes(selectedRole);
  };

  const roleNeedsFacultad = (selectedRole) => {
    return selectedRole === 'academico'; 
  };

  useEffect(() => {
    const fetchFacultades = async () => {
      try {
        console.log('Fetching facultades...');
        const response = await apiClient.get('/facultades');
        console.log('Facultades response:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          const facultadesFormateadas = response.data.map(facultad => ({
            label: facultad.nombre,
            value: facultad.facultad_id.toString()
          }));
          console.log('Facultades formateadas:', facultadesFormateadas);
          setOpcionesFacultad(facultadesFormateadas);
        } else {
          console.log('No hay facultades o formato incorrecto');
          setOpcionesFacultad([
            { label: 'Facultad de Ingeniería', value: '1' },
            { label: 'Facultad de Ciencias Económicas', value: '2' },
            { label: 'Facultad de Ciencias de la Salud', value: '3' },
            { label: 'Facultad de Diseño y Tecnología', value: '4' },
            { label: 'Facultad de Ciencias Jurídicas', value: '5' },
          ]);
        }
      } catch (error) {
        console.error('Error al obtener las Facultades', error);
        setOpcionesFacultad([
          { label: 'Facultad de Ingeniería', value: '1' },
          { label: 'Facultad de Ciencias Económicas', value: '2' },
          { label: 'Facultad de Ciencias de la Salud', value: '3' },
          { label: 'Facultad de Diseño y Tecnología', value: '4' },
          { label: 'Facultad de Ciencias Jurídicas', value: '5' },
        ]);
        Alert.alert('Aviso', 'Se cargaron facultades por defecto. Verifica la conexión con el servidor.');
      }
    };
    fetchFacultades();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const TOKEN_KEY = 'adminAuthToken';
      let token;
      try {
        if (Platform.OS === 'web') {
          token = localStorage.getItem(TOKEN_KEY);
        } else {
          token = await SecureStore.getItemAsync(TOKEN_KEY);
        }
        
        if (!token) {
          Alert.alert("Acceso Denegado", "No estás autenticado. Por favor, inicia sesión.");
          router.replace('/Login');
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        Alert.alert("Error", "Error verificando la autenticación.");
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
  if (role !== 'docente') {
    setCarrerasDocente([]);
  }
  if (role !== 'student' && role !== 'academico') {
    setCarreraSeleccionada(null);
  }
}, [role]);
useEffect(() => {
  setOpenCarrera(false);
  setOpenFacultad(false);
}, [role]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1: 
        if (!formData.username.trim()) {
          newErrors.username = 'El nombre de usuario es requerido.';
        } else if (formData.username.length < 3) {
          newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres.';
        }
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido.';
        if (!formData.apellidopat.trim()) newErrors.apellidopat = 'El apellido paterno es requerido.';
        break;
        
      case 2: 
        if (!formData.email.trim()) {
          newErrors.email = 'El email es requerido.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'El formato del email no es válido.';
        }
        if (!formData.contrasenia) {
          newErrors.contrasenia = 'La contraseña es requerida.';
        } else if (formData.contrasenia.length < 6) {
          newErrors.contrasenia = 'La contraseña debe tener al menos 6 caracteres.';
        }
        break;
        
      case 3:
        if (!role) {
          newErrors.role = 'El rol es requerido.';
        }

        if (roleNeedsCarreras(role)) {
          const carreraValida = role === 'docente' ? 
            (carrerasDocente && carrerasDocente.length > 0) : 
            carreraSeleccionada; // ✅ Usar carreraSeleccionada (singular)
            
          if (!carreraValida) {
            if (role === 'student') {
              newErrors.carrera = 'Debe seleccionar la carrera del estudiante.';
            } else if (role === 'academico') { 
              newErrors.carrera = 'Debe seleccionar la carrera que dirigirá.';
            } else if (role === 'docente') {
              newErrors.carrera = 'Debe seleccionar al menos una carrera donde enseñará.';
            }
          }
        }
        if(role === 'academico'){
          if( !facultadSeleccionada){
            newErrors.facultad = 'Debe Seleccionar la facultaad para el director ';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleAddUser = async () => {
    if (!validateStep(3)) return;
    
    setIsLoading(true);
    console.log("=== DIAGNÓSTICO ===");
    console.log("Role seleccionado:", role);
    console.log("Carrera seleccionada:", carreraSeleccionada); // ✅ Singular
    console.log("Carreras docente:", carrerasDocente);
    console.log("Facultad seleccionada:", facultadSeleccionada);
    try {
      const newUserPayload = {
        username: formData.username.trim(),
        nombre: formData.nombre.trim(),
        apellidopat: formData.apellidopat.trim(),
        apellidomat: formData.apellidomat.trim(),
        email: formData.email.trim().toLowerCase(),
        contrasenia: formData.contrasenia,
        role: role,
        habilitado: formData.habilitado ? 1 : 0,
      };

      // ✅ CORREGIDO: Lógica separada y correcta
      if (roleNeedsCarreras(role)) {
        if (role === 'student' || role === 'academico') {
          if (carreraSeleccionada) {
            newUserPayload.idcarrera = parseInt(carreraSeleccionada);
          }
        } else if (role === 'docente') {
          if (carrerasDocente && carrerasDocente.length > 0) {
            newUserPayload.carreras_ids = carrerasDocente.map(id => parseInt(id));
          }
        }
      }

      if (role === 'academico' && facultadSeleccionada) {
        newUserPayload.idfacultad = parseInt(facultadSeleccionada);
      }
     
      console.log("FRONTEND - Payload enviado:", JSON.stringify(newUserPayload, null, 2));
      
      const response = await apiClient.post('/auth/register', newUserPayload);

      if (response.status === 201 || response.status === 200) {
        Alert.alert(
          '¡Éxito!', 
          'Usuario creado correctamente.',
          [
            {
              text: 'OK',
              onPress: () => {
                setFormData({
                  username: '',
                  nombre: '',
                  apellidopat: '',
                  apellidomat: '',
                  email: '',
                  contrasenia: '',
                  habilitado: true,
                });
                setRole(null);
                setCarreraSeleccionada(null); // ✅ Reset correcto
                setCarrerasDocente([]);
                setFacultadSeleccionada(null); // ✅ Reset correcto
                setCurrentStep(1);
                
                router.replace('/login') 
                }
              }
            
          ]
        );
      }
      
    } catch (error) {
      console.error("Error al crear usuario:", error);
      
      let errorMessage = 'Error desconocido al crear usuario.';
      const newErrors = {};
      let stepToRevert = 1;

      if (error.response) {
        console.error("Respuesta del servidor:", error.response.data);
        console.error("Errores de validación:", error.response.data.errors);
        
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;

          if (error.response.data?.errors && Array.isArray(error.response.data.errors)) {
            const backendErrors = error.response.data.errors;
            const errorMessages = [];

            backendErrors.forEach(err => {
              const fieldPath = err.path || err.param;
              const message = err.message || err.msg;

              if (fieldPath) {
                newErrors[fieldPath] = message;
                if (['username', 'nombre', 'apellidopat', 'apellidomat'].includes(fieldPath)) {
                  stepToRevert = Math.min(stepToRevert, 1);
                } else if (['email', 'contrasenia'].includes(fieldPath)) {
                  stepToRevert = Math.min(stepToRevert, 2);
                } else if (['role', 'carrera', 'facultad_id', 'idcarrera', 'facultad_id', 'carreras_ids'].some(f => fieldPath.includes(f))) {
                  stepToRevert = Math.min(stepToRevert, 3);
                }
              }
              errorMessages.push(message);
            });
            errorMessage = errorMessages.join('\n');
          }
        } else if (error.response.status === 409) {
          errorMessage = 'El usuario ya existe. Intenta con otro nombre de usuario o email.';
          stepToRevert = 1;
        } else if (error.response.status >= 500) {
          errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      }

      setErrors(prev => ({ ...prev, ...newErrors }));
      setCurrentStep(stepToRevert);

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const closeAllDropdowns = () => {
    setOpen(false);
    setOpenCarrera(false);
    setOpenFacultad(false);
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.progressStep}>
          <View style={[
            styles.progressCircle,
            currentStep >= step && styles.progressCircleActive
          ]}>
            {currentStep > step ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : (
              <Text style={[
                styles.progressNumber,
                currentStep >= step && styles.progressNumberActive
              ]}>
                {step}
              </Text>
            )}
          </View>
          {step < 3 && (
            <View style={[
              styles.progressLine,
              currentStep > step && styles.progressLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStepTitle = () => {
    const titles = [
      'Información Personal',
      'Credenciales',
      'Rol y Configuración'
    ];
    return (
      <Text style={styles.stepTitle}>
        {titles[currentStep - 1]}
      </Text>
    );
  };

  const renderInputField = (label, field, placeholder, options = {}) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label}
        {options.required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.inputWrapper}>
        {options.icon && (
          <Ionicons name={options.icon} size={20} color="#666" style={styles.inputIcon} />
        )}
        <TextInput
          style={[
            styles.input,
            options.icon && styles.inputWithIcon,
            errors[field] && styles.inputError
          ]}
          placeholder={placeholder}
          value={formData[field]}
          onChangeText={(value) => updateFormData(field, value)}
          secureTextEntry={field === 'contrasenia' && !showPassword}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'none'}
          placeholderTextColor="#999"
          onFocus={closeAllDropdowns}
        />
        {field === 'contrasenia' && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      {renderInputField('Nombre de Usuario', 'username', 'Ej: jperez', {
        required: true,
        icon: 'person-outline',
        autoCapitalize: 'none'
      })}
      
      {renderInputField('Nombre(s)', 'nombre', 'Ej: Juan Carlos', {
        required: true,
        icon: 'card-outline',
        autoCapitalize: 'words'
      })}
      
      {renderInputField('Apellido Paterno', 'apellidopat', 'Ej: Pérez', {
        required: true,
        icon: 'card-outline',
        autoCapitalize: 'words'
      })}
      
      {renderInputField('Apellido Materno', 'apellidomat', 'Ej: López (Opcional)', {
        icon: 'card-outline',
        autoCapitalize: 'words'
      })}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      {renderInputField('Correo Electrónico', 'email', 'ejemplo@correo.com', {
        required: true,
        icon: 'mail-outline',
        keyboardType: 'email-address',
        autoCapitalize: 'none'
      })}
      
      {renderInputField('Contraseña', 'contrasenia', 'Mínimo 6 caracteres', {
        required: true,
        icon: 'lock-closed-outline'
      })}
      
      <View style={styles.passwordStrengthContainer}>
        <View style={styles.passwordStrength}>
          <View style={[
            styles.strengthBar,
            formData.contrasenia.length >= 6 && styles.strengthBarWeak
          ]} />
          <View style={[
            styles.strengthBar,
            formData.contrasenia.length >= 8 && /[A-Z]/.test(formData.contrasenia) && styles.strengthBarMedium
          ]} />
          <View style={[
            styles.strengthBar,
            formData.contrasenia.length >= 8 && /[A-Z]/.test(formData.contrasenia) && /[0-9]/.test(formData.contrasenia) && styles.strengthBarStrong
          ]} />
        </View>
        <Text style={styles.passwordHint}>
          Usa al menos 6 caracteres con mayúsculas y números para mayor seguridad
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.label}>
        Rol <Text style={styles.required}>*</Text>
      </Text>
      <View style={[styles.dropdownContainer, { zIndex: 5000 }]}>
        <DropDownPicker
          open={open}
          value={role}
          items={items}
          setOpen={setOpen}
          setValue={setRole}
          setItems={setItems}
          placeholder="Selecciona un rol"
          style={[styles.dropdown, errors.role && styles.inputError]}
          dropDownContainerStyle={[
            styles.dropdownList,
            { 
              zIndex: 5000, 
              elevation: 5000,
            }
          ]}
          listMode="SCROLLVIEW"
          textStyle={styles.dropdownText}
          placeholderStyle={styles.dropdownPlaceholder}
          onOpen={() => {
            setOpenCarrera(false);
            setOpenFacultad(false);
          }}
          searchable={false}
          showArrowIcon={true}
          showTickIcon={true}
          itemSeparator={true}
          itemSeparatorStyle={{
            backgroundColor: "#f0f0f0"
          }}
        />
      </View>
      {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}

      {roleNeedsCarreras(role) && (
        <View style={styles.conditionalContainer}>
          <Text style={styles.label}>
            {role === 'student' && 'Carrera del Estudiante'}
            {role === 'academico' && 'Carrera a Dirigir'} {/* ✅ CORRECCIÓN */}
            {role === 'docente' && 'Carreras donde Enseña'}
            <Text style={styles.required}> *</Text>
          </Text>
          <View style={[styles.dropdownContainer, { zIndex: 2000 }]}>
            <DropDownPicker
              multiple={role === 'docente'}
              min={1}
              max={role === 'docente' ? 5 : 1}
              open={openCarrera}
              // ✅ CORREGIDO: Estados correctos
              value={role === 'docente' ? carrerasDocente : carreraSeleccionada}
              items={opcionesCarrera}
              setOpen={setOpenCarrera}
              // ✅ CORREGIDO: Funciones correctas
              setValue={role === 'docente' ? setCarrerasDocente : setCarreraSeleccionada}
              setItems={setOpcionesCarrera}
              placeholder={
                role === 'student' ? 'Selecciona la carrera del estudiante' :
                role === 'academico' ? 'Selecciona la carrera a dirigir' : 
                'Selecciona las carreras donde enseñará'
              }
              style={[styles.dropdown, errors.carrera && styles.inputError]}
              dropDownContainerStyle={styles.dropdownList}
              listMode="SCROLLVIEW"
              textStyle={styles.dropdownText}
              placeholderStyle={styles.dropdownPlaceholder}
              multipleText={role === 'docente' ? "%d carreras seleccionadas" : undefined}
              onOpen={() => {
                setOpen(false);
                setOpenFacultad(false);
              }}
            />
          </View>
          {errors.carrera && <Text style={styles.errorText}>{errors.carrera}</Text>}
          
          <View style={styles.roleInfoContainer}>
            <Text style={styles.roleInfoText}>
              {role === 'student' && '💡 El estudiante será asignado a esta carrera'}
              {role === 'academico' && '💡 Este usuario será el director de la carrera seleccionada'} {/* ✅ CORRECCIÓN */}
              {role === 'docente' && '💡 El docente podrá enseñar en las carreras seleccionadas'}
            </Text>
          </View>
        </View>
      )}

      {roleNeedsFacultad(role) && (
        <View style={styles.conditionalContainer}>
          <Text style={styles.label}>
            Seleccionar Facultad <Text style={styles.required}>*</Text>
          </Text>
          
          <View style={[styles.dropdownContainer, { zIndex: 2000 }]}>
            <DropDownPicker
              multiple={false}
              open={openFacultad}
              value={facultadSeleccionada}
              items={opcionesFacultad}
              setOpen={setOpenFacultad}
              setValue={setFacultadSeleccionada}
              setItems={setOpcionesFacultad}
              placeholder="Selecciona la facultad a dirigir"
              style={[styles.dropdown, errors.facultad && styles.inputError]}
              dropDownContainerStyle={[
                styles.dropdownList,
                { 
                  zIndex: 2000, 
                  elevation: 2000,
                }
              ]}
              listMode="SCROLLVIEW"
              textStyle={styles.dropdownText}
              placeholderStyle={styles.dropdownPlaceholder}
              onOpen={() => {
                setOpen(false);
                setOpenCarrera(false);
              }}
              searchable={false}
              showArrowIcon={true}
              showTickIcon={true}
              itemSeparator={true}
              itemSeparatorStyle={{
                backgroundColor: "#f0f0f0"
              }}
            />
          </View>
          {errors.facultad && <Text style={styles.errorText}>{errors.facultad}</Text>}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Stack.Screen 
          options={{ 
            title: 'Nuevo Usuario',
            headerStyle: {
              backgroundColor: '#e95a0c',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            {renderProgressBar()}
            {renderStepTitle()}
          </View>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={prevStep}
                disabled={isLoading}
              >
                <Ionicons name="arrow-back" size={20} color="#e95a0c" />
                <Text style={styles.secondaryButtonText}>Anterior</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isLoading && styles.buttonDisabled,
                currentStep === 1 && styles.fullWidthButton
              ]}
              onPress={currentStep === totalSteps ? handleAddUser : nextStep}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {currentStep === totalSteps ? 'Crear Usuario' : 'Siguiente'}
                  </Text>
                  {currentStep < totalSteps && (
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e95a0c',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleActive: {
    backgroundColor: '#e95a0c',
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  progressNumberActive: {
    color: '#fff',
  },
  progressLine: {
    width: 50,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
  },
  confirmationText: {
    fontSize: 14,
    color: '#27ae60',
    marginTop: 5,
    fontStyle: 'italic',
  },
  progressLineActive: {
    backgroundColor: '#e95a0c',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  stepContainer: {
    paddingVertical: 20,
     paddingBottom: 80,
  },
  conditionalContainer: {
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  required: {
    color: '#e74c3c',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  inputWithIcon: {
    paddingLeft: 50,
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    top: 17,
    zIndex: 1,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 17,
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  passwordStrengthContainer: {
    marginTop: 10,
  },
  passwordStrength: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginRight: 5,
    borderRadius: 2,
  },
  strengthBarWeak: {
    backgroundColor: '#e74c3c',
  },
  strengthBarMedium: {
    backgroundColor: '#f39c12',
  },
  strengthBarStrong: {
    backgroundColor: '#27ae60',
  },
  passwordHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  dropdownContainer: {
    marginBottom: 15,
    zIndex:9999,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 50,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    zIndex:9999,
    elevation:9999,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  roleInfoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#e95a0c',
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 30,
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#e95a0c',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 1,
    shadowColor: '#e95a0c',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 1,
    borderWidth: 2,
    borderColor: '#e95a0c',
  },
  fullWidthButton: {
    flex: 1,
  },
  buttonDisabled: {
    backgroundColor: '#f9bda3',
    shadowOpacity: 0.1,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#e95a0c',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CrearUsuarioA;