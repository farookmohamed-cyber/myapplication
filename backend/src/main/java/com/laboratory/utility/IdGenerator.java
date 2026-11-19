package com.laboratory.utility;

import org.springframework.stereotype.Component;
import java.time.Year;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class IdGenerator {

    private final AtomicInteger patientCounter = new AtomicInteger(1001);
    private final AtomicInteger sampleCounter = new AtomicInteger(2001);
    private final AtomicInteger reportCounter = new AtomicInteger(3001);
    private final AtomicInteger staffCounter = new AtomicInteger(401);
    private final AtomicInteger testCounter = new AtomicInteger(501);

    public String nextPatientCode() {
        return String.format("PAT-%d-%04d", Year.now().getValue(), patientCounter.getAndIncrement());
    }

    public String nextSampleCode() {
        return String.format("SMP-%d-%04d", Year.now().getValue(), sampleCounter.getAndIncrement());
    }

    public String nextReportCode() {
        return String.format("RPT-%d-%04d", Year.now().getValue(), reportCounter.getAndIncrement());
    }

    public String nextStaffCode() {
        return String.format("STF-%04d", staffCounter.getAndIncrement());
    }

    public String nextTestCode() {
        return String.format("TST-%04d", testCounter.getAndIncrement());
    }
}
