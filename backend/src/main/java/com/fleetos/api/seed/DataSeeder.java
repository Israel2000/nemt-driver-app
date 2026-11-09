package com.fleetos.api.seed;

import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.Credential;
import com.fleetos.api.domain.Driver;
import com.fleetos.api.domain.Role;
import com.fleetos.api.domain.Trip;
import com.fleetos.api.domain.TripStatus;
import com.fleetos.api.domain.Vehicle;
import com.fleetos.api.domain.Workspace;
import com.fleetos.api.repo.AppUserRepository;
import com.fleetos.api.repo.CredentialRepository;
import com.fleetos.api.repo.DriverRepository;
import com.fleetos.api.repo.TripRepository;
import com.fleetos.api.repo.VehicleRepository;
import com.fleetos.api.repo.WorkspaceRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds the demo workspace/users the frontend has always used, the first time
 * the app starts against an empty database. Runs ONLY when the users table is
 * empty — it never overwrites real data. Passwords are BCrypt hashes, never
 * plaintext (demo logins: admin@nemtos.com / admin123, driver@nemtos.com /
 * driver123, operator@metrotransit.com / demo).
 */
@Component
public class DataSeeder implements CommandLineRunner {

  private final AppUserRepository users;
  private final WorkspaceRepository workspaces;
  private final DriverRepository drivers;
  private final VehicleRepository vehicles;
  private final TripRepository trips;
  private final CredentialRepository credentials;
  private final PasswordEncoder passwordEncoder;

  public DataSeeder(AppUserRepository users, WorkspaceRepository workspaces,
      DriverRepository drivers, VehicleRepository vehicles, TripRepository trips,
      CredentialRepository credentials, PasswordEncoder passwordEncoder) {
    this.users = users;
    this.workspaces = workspaces;
    this.drivers = drivers;
    this.vehicles = vehicles;
    this.trips = trips;
    this.credentials = credentials;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  @Transactional
  public void run(String... args) {
    if (users.count() > 0) {
      return;
    }

    Workspace ws = new Workspace("ws-metro-01", "Metro Care Transit LLC",
        "NEMT-CO-88419", "6-20 vehicles", "growth");
    // NB: Workspace has an assigned String id, so save() merges and returns
    // the managed copy — the original instance stays detached. Use the return.
    ws = workspaces.save(ws);

    AppUser admin = new AppUser("admin@nemtos.com",
        passwordEncoder.encode("admin123"), "Sarah Jenkins (Fleet Director)", Role.ADMIN, ws);
    AppUser driverUser = new AppUser("driver@nemtos.com",
        passwordEncoder.encode("driver123"), "Marcus Vance (NEMT Driver)", Role.DRIVER, ws);
    AppUser operator = new AppUser("operator@metrotransit.com",
        passwordEncoder.encode("demo"), "Metro Care Operations Lead", Role.DISPATCHER, ws);
    users.save(admin);
    users.save(driverUser);
    users.save(operator);

    Driver marcus = new Driver("DRV-101", driverUser, ws);
    marcus.setLicenseExpiresAt(LocalDate.of(2026, 11, 15));
    marcus.setDqfId("DRV-101");
    Driver elena = new Driver("DRV-102", null, ws);
    elena.setLicenseExpiresAt(LocalDate.of(2027, 3, 1));
    elena.setDqfId("DRV-102");
    Driver darnell = new Driver("DRV-103", null, ws);
    darnell.setLicenseExpiresAt(LocalDate.of(2026, 8, 20));
    darnell.setDqfId("DRV-103");
    drivers.save(marcus);
    drivers.save(elena);
    drivers.save(darnell);

    Vehicle van1 = new Vehicle(ws, "Van #1");
    van1.setWheelchairAccessible(true);
    van1.setCapacity(6);
    Vehicle van2 = new Vehicle(ws, "Van #2");
    van2.setCapacity(8);
    Vehicle van3 = new Vehicle(ws, "Van #3");
    van3.setCapacity(8);
    vehicles.save(van1);
    vehicles.save(van2);
    vehicles.save(van3);

    Trip trp100 = new Trip("TRP-100", ws);
    trp100.setRiderName("Robert Chen");
    trp100.setPickupAddress("1200 E Colfax Ave, Denver, CO");
    trp100.setDropoffAddress("8200 E Belleview Ave, Greenwood Village, CO");
    trp100.setStatus(TripStatus.COMPLETED);
    trp100.setDriver(marcus);
    trp100.setVehicle(van1);
    trp100.setOdometerStart(48210);
    trp100.setOdometerEnd(48231);
    trp100.setPassengerSignature(true);
    trp100.setDriverSignature(true);
    trp100.setBillable(true);

    Trip trp101 = new Trip("TRP-101", ws);
    trp101.setRiderName("Eleanor Vance");
    trp101.setPickupAddress("500 E Hampden Ave, Englewood, CO");
    trp101.setDropoffAddress("1420 S Pearl St, Denver, CO");
    trp101.setStatus(TripStatus.ASSIGNED);
    trp101.setWheelchair(true);
    trp101.setDriver(marcus);
    trp101.setVehicle(van1);

    Trip trp102 = new Trip("TRP-102", ws);
    trp102.setRiderName("James Miller");
    trp102.setPickupAddress("900 E 11th Ave, Denver, CO");
    trp102.setDropoffAddress("1600 N Downing St, Denver, CO");
    trp102.setStatus(TripStatus.ASSIGNED);
    trp102.setDriver(elena);
    trp102.setVehicle(van2);

    trips.save(trp100);
    trips.save(trp101);
    trips.save(trp102);

    credentials.save(new Credential(marcus, "CPR", LocalDate.of(2027, 10, 1), "VALID"));
    credentials.save(new Credential(marcus, "LICENSE", LocalDate.of(2026, 11, 15), "WARNING"));
    credentials.save(new Credential(marcus, "DOT_MEDICAL", LocalDate.of(2027, 6, 1), "VALID"));
    credentials.save(new Credential(elena, "CPR", LocalDate.of(2027, 5, 20), "VALID"));
    credentials.save(new Credential(elena, "LICENSE", LocalDate.of(2027, 3, 1), "VALID"));
    credentials.save(new Credential(darnell, "CPR", LocalDate.of(2026, 9, 15), "EXPIRED"));
    credentials.save(new Credential(darnell, "LICENSE", LocalDate.of(2026, 8, 20), "EXPIRED"));
  }
}
